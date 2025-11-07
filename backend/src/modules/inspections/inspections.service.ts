import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';

import { PrismaService } from '../../common/database/prisma.service';
import { GoogleMailService } from '../google/google-mail.service';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { ListInspectionsQueryDto } from './dto/list-inspections-query.dto';
import { SendInspectionReportDto } from './dto/send-inspection-report.dto';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { BrandService } from '../../common/brand/brand.service';

@Injectable()
export class InspectionsService {
  private readonly logger = new Logger(InspectionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: GoogleMailService,
    private readonly brandService: BrandService,
  ) {}

  async create(inspector: JwtPayload, dto: CreateInspectionDto) {
    this.ensureManager(inspector.role);

    const date = new Date(dto.date);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Ongeldige datum voor inspectie.');
    }

    const inspection = await this.prisma.inspection.create({
      data: {
        inspectorId: inspector.sub,
        location: dto.location.trim(),
        date,
        notes: dto.notes?.trim(),
        items: {
          create: dto.items.map((item) => ({
            description: item.description.trim(),
            score: item.score,
            notes: item.notes?.trim() ?? null,
          })),
        },
      },
      include: { items: true },
    });

    return inspection;
  }

  async list(inspector: JwtPayload, query: ListInspectionsQueryDto) {
    const where = this.buildWhere(inspector, query);
    return this.prisma.inspection.findMany({
      where,
      orderBy: { date: 'desc' },
      include: { items: true, inspector: { select: { id: true, email: true } } },
    });
  }

  async getById(id: string, user: JwtPayload) {
    const inspection = await this.prisma.inspection.findUnique({
      where: { id },
      include: { items: true, inspector: { select: { id: true, email: true } } },
    });
    if (!inspection) {
      throw new NotFoundException('Inspectie niet gevonden.');
    }
    if (user.role !== UserRole.MANAGER && inspection.inspectorId !== user.sub) {
      throw new ForbiddenException('Geen toegang tot deze inspectie.');
    }
    return inspection;
  }

  async generatePdf(id: string, user: JwtPayload) {
    this.ensureManager(user.role);

    const inspection = await this.prisma.inspection.findUnique({ where: { id } });
    if (!inspection) {
      throw new NotFoundException('Inspectie niet gevonden.');
    }

    const pdfUrl = `stub://inspections/${inspection.id}.pdf`;
    await this.prisma.inspection.update({
      where: { id },
      data: { pdfUrl },
    });

    return { pdfUrl };
  }

  async sendReport(id: string, user: JwtPayload, dto: SendInspectionReportDto) {
    this.ensureManager(user.role);

    const inspection = await this.prisma.inspection.findUnique({
      where: { id },
      include: { inspector: true },
    });
    if (!inspection) {
      throw new NotFoundException('Inspectie niet gevonden.');
    }

    const pdfUrl =
      inspection.pdfUrl ??
      (await this.generatePdf(id, user)).pdfUrl;

    const subject =
      dto.subject ??
      `Inspectierapport ${inspection.location} - ${inspection.date.toLocaleDateString('nl-NL')}`;
    const brand = this.brandService.appName;
    const message =
      dto.message ??
      `Beste klant,\n\nHierbij het inspectierapport voor ${inspection.location} op ${inspection.date.toLocaleDateString('nl-NL')}.\nPDF: ${pdfUrl}\n\nMet vriendelijke groet,\n${brand}`;

    try {
      await this.mailService.sendEmail(inspection.inspectorId, {
        to: dto.recipientEmail,
        subject,
        body: `${message}\n\nSamenvatting:\n- Totaal items: ${await this.countItems(id)}\n`,
      });
    } catch (error) {
      this.logger.warn(`Verzenden van inspectierapport ${id} mislukt: ${error}`);
      throw new BadRequestException('Versturen van de e-mail is mislukt.');
    }

    return { sent: true, pdfUrl };
  }

  private async countItems(inspectionId: string): Promise<number> {
    return this.prisma.inspectionItem.count({ where: { inspectionId } });
  }

  private ensureManager(role: UserRole) {
    if (role !== UserRole.MANAGER) {
      throw new ForbiddenException('Alleen managers kunnen inspecties beheren.');
    }
  }

  private buildWhere(user: JwtPayload, query: ListInspectionsQueryDto): Prisma.InspectionWhereInput {
    const where: Prisma.InspectionWhereInput = {};
    if (user.role !== UserRole.MANAGER) {
      where.inspectorId = user.sub;
    }

    if (query.from || query.to) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (query.from) {
        const from = new Date(query.from);
        if (!Number.isNaN(from.getTime())) {
          from.setHours(0, 0, 0, 0);
          dateFilter.gte = from;
        }
      }
      if (query.to) {
        const to = new Date(query.to);
        if (!Number.isNaN(to.getTime())) {
          to.setHours(23, 59, 59, 999);
          dateFilter.lte = to;
        }
      }
      where.date = dateFilter;
    }

    if (query.location) {
      where.location = { contains: query.location.trim(), mode: 'insensitive' };
    }

    return where;
  }
}
