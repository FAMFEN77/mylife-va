import { Injectable, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { parseString } from '@fast-csv/parse';

import { PrismaService } from '../../common/database/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { CustomerResponse, mapCustomer } from './customer.mapper';
import { JwtPayload } from '../../common/decorators/current-user.decorator';

interface CsvRow {
  companyName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  street?: string;
  houseNumber?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  kvkNumber?: string;
  vatNumber?: string;
}

export interface CsvImportResult {
  created: number;
  updated: number;
  errors: Array<{ line: number; message: string }>;
}

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: JwtPayload, dto: CreateCustomerDto): Promise<CustomerResponse> {
    const organisationId = this.requireOrganisation(user);
    try {
      const customer = await this.prisma.customer.create({
        data: this.normalizeCreateInput(dto, {
          organisationId,
          createdById: user.sub,
        }),
      });
      return mapCustomer(customer);
    } catch (error) {
      this.handlePrismaError(error);
      throw error;
    }
  }

  async findMany(
    user: JwtPayload,
    query: QueryCustomerDto,
  ): Promise<{ items: CustomerResponse[]; total: number; page: number; pageSize: number }> {
    const organisationId = this.requireOrganisation(user);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;
    const skip = (page - 1) * pageSize;
    const orderByField = query.sort ?? 'createdAt';
    const orderDirection = query.dir ?? 'desc';

    const where: Prisma.CustomerWhereInput = {
      organisationId,
      ...this.buildArchivedFilter(query.archived),
    };

    if (query.city) {
      where.city = { equals: query.city, mode: 'insensitive' };
    }
    if (query.email) {
      where.email = { equals: query.email.toLowerCase(), mode: 'insensitive' };
    }
    if (query.q && query.q.trim().length) {
      const keyword = query.q.trim();
      where.OR = [
        { firstName: { contains: keyword, mode: 'insensitive' } },
        { lastName: { contains: keyword, mode: 'insensitive' } },
        { companyName: { contains: keyword, mode: 'insensitive' } },
        { email: { contains: keyword, mode: 'insensitive' } },
        { phone: { contains: keyword, mode: 'insensitive' } },
        { city: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const [total, customers] = await this.prisma.$transaction([
      this.prisma.customer.count({ where }),
      this.prisma.customer.findMany({
        where,
        orderBy: { [orderByField]: orderDirection },
        skip,
        take: pageSize,
      }),
    ]);

    return {
      items: customers.map(mapCustomer),
      total,
      page,
      pageSize,
    };
  }

  async findById(user: JwtPayload, customerId: string): Promise<CustomerResponse> {
    const organisationId = this.requireOrganisation(user);
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, organisationId },
    });
    if (!customer) {
      throw new NotFoundException('Klant niet gevonden.');
    }
    return mapCustomer(customer);
  }

  async update(user: JwtPayload, customerId: string, dto: UpdateCustomerDto): Promise<CustomerResponse> {
    const organisationId = this.requireOrganisation(user);
    const existing = await this.prisma.customer.findFirst({
      where: { id: customerId, organisationId },
    });
    if (!existing) {
      throw new NotFoundException('Klant niet gevonden.');
    }
    const data = this.normalizeUpdateInput(dto);
    try {
      const customer = await this.prisma.customer.update({
        where: { id: customerId },
        data,
      });
      return mapCustomer(customer);
    } catch (error) {
      this.handlePrismaError(error);
      throw error;
    }
  }

  async archive(user: JwtPayload, customerId: string): Promise<void> {
    const organisationId = this.requireOrganisation(user);
    this.ensureManagerRole(user.role);
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, organisationId },
      select: { id: true, archivedAt: true },
    });
    if (!customer) {
      throw new NotFoundException('Klant niet gevonden.');
    }
    if (customer.archivedAt) {
      return;
    }
    await this.prisma.customer.update({
      where: { id: customerId },
      data: { archivedAt: new Date() },
    });
  }

  async restore(user: JwtPayload, customerId: string): Promise<CustomerResponse> {
    const organisationId = this.requireOrganisation(user);
    this.ensureManagerRole(user.role);
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, organisationId },
    });
    if (!customer) {
      throw new NotFoundException('Klant niet gevonden.');
    }
    if (!customer.archivedAt) {
      return mapCustomer(customer);
    }
    const restored = await this.prisma.customer.update({
      where: { id: customerId },
      data: { archivedAt: null },
    });
    return mapCustomer(restored);
  }

  async importCsv(user: JwtPayload, raw: string): Promise<CsvImportResult> {
    const organisationId = this.requireOrganisation(user);
    const rows = await this.parseCsv(raw);

    let created = 0;
    let updated = 0;
    const errors: Array<{ line: number; message: string }> = [];

    for (const entry of rows) {
      const { line, data } = entry;
      const email = data.email?.trim().toLowerCase();
      const firstName = data.firstName?.trim();
      const lastName = data.lastName?.trim();
      if (!email || !firstName || !lastName) {
        errors.push({ line, message: 'Ontbrekende verplichte velden (email, voornaam, achternaam).' });
        continue;
      }

      const createPayload: CreateCustomerDto = {
        companyName: data.companyName,
        firstName,
        lastName,
        email,
        phone: data.phone,
        street: data.street,
        houseNumber: data.houseNumber,
        postalCode: data.postalCode,
        city: data.city,
        country: data.country,
        kvkNumber: data.kvkNumber,
        vatNumber: data.vatNumber,
      };

      try {
        const result = await this.prisma.customer.upsert({
          where: {
            organisationId_email: {
              organisationId,
              email,
            },
          },
          update: this.normalizeUpdateInput(createPayload, { archivedAt: null }),
          create: this.normalizeCreateInput(createPayload, {
            organisationId,
            createdById: user.sub,
          }),
        });
        if (result.createdAt.getTime() === result.updatedAt.getTime()) {
          created += 1;
        } else {
          updated += 1;
        }
      } catch (error) {
        errors.push({ line, message: (error as Error).message });
      }
    }

    return { created, updated, errors };
  }

  private ensureManagerRole(role: UserRole) {
    if (role !== UserRole.MANAGER) {
      throw new ForbiddenException('Je hebt geen rechten om deze actie uit te voeren.');
    }
  }

  private requireOrganisation(user: JwtPayload): string {
    if (!user.organisationId) {
      throw new ForbiddenException('Geen toegang tot organisatie.');
    }
    return user.organisationId;
  }

  private normalizeCreateInput(
    dto: CreateCustomerDto,
    extra: Pick<Prisma.CustomerUncheckedCreateInput, 'organisationId'> &
      Partial<Pick<Prisma.CustomerUncheckedCreateInput, 'createdById'>>,
  ): Prisma.CustomerUncheckedCreateInput {
    const normalizeNullable = (value?: string | null) => {
      const trimmed = value?.trim();
      return trimmed && trimmed.length ? trimmed : null;
    };

    return {
      organisationId: extra.organisationId,
      companyName: normalizeNullable(dto.companyName),
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      email: dto.email.trim().toLowerCase(),
      phone: normalizeNullable(dto.phone),
      street: normalizeNullable(dto.street),
      houseNumber: normalizeNullable(dto.houseNumber),
      postalCode: normalizeNullable(dto.postalCode),
      city: normalizeNullable(dto.city),
      country: normalizeNullable(dto.country),
      kvkNumber: normalizeNullable(dto.kvkNumber),
      vatNumber: normalizeNullable(dto.vatNumber),
      archivedAt: null,
      createdById: extra.createdById ?? null,
    };
  }

  private normalizeUpdateInput(
    dto: UpdateCustomerDto | Partial<CreateCustomerDto>,
    extra?: Prisma.CustomerUncheckedUpdateInput,
  ): Prisma.CustomerUncheckedUpdateInput {
    const sanitize = (value?: string | null) => {
      const trimmed = value?.trim();
      return trimmed && trimmed.length ? trimmed : null;
    };

    const data: Prisma.CustomerUncheckedUpdateInput = {
      ...extra,
    };

    if (dto.companyName !== undefined) data.companyName = sanitize(dto.companyName);
    if (dto.firstName !== undefined) data.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) data.lastName = dto.lastName.trim();
    if (dto.email !== undefined) data.email = dto.email.trim().toLowerCase();
    if (dto.phone !== undefined) data.phone = sanitize(dto.phone);
    if (dto.street !== undefined) data.street = sanitize(dto.street);
    if (dto.houseNumber !== undefined) data.houseNumber = sanitize(dto.houseNumber);
    if (dto.postalCode !== undefined) data.postalCode = sanitize(dto.postalCode);
    if (dto.city !== undefined) data.city = sanitize(dto.city);
    if (dto.country !== undefined) data.country = sanitize(dto.country);
    if (dto.kvkNumber !== undefined) data.kvkNumber = sanitize(dto.kvkNumber);
    if (dto.vatNumber !== undefined) data.vatNumber = sanitize(dto.vatNumber);

    return data;
  }

  private buildArchivedFilter(
    archived: 'only' | 'exclude' | 'include' | undefined,
  ): Prisma.CustomerWhereInput {
    if (archived === 'only') {
      return { archivedAt: { not: null } };
    }
    if (archived === 'include') {
      return {};
    }
    return { archivedAt: null };
  }

  private handlePrismaError(error: unknown): void {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('Er bestaat al een klant met dit e-mailadres binnen de organisatie.');
    }
  }

  private async parseCsv(raw: string): Promise<Array<{ line: number; data: CsvRow }>> {
    const rows: Array<{ line: number; data: CsvRow }> = [];
    if (!raw?.trim()) {
      return rows;
    }

    await new Promise<void>((resolve, reject) => {
      parseString<CsvRow, CsvRow>(raw, {
        headers: true,
        ignoreEmpty: true,
        renameHeaders: false,
        trim: true,
      })
        .on('error', (error) => reject(error))
        .on('data', (data) => {
          rows.push({ line: rows.length + 2, data });
        })
        .on('end', () => resolve());
    });

    return rows;
  }
}
