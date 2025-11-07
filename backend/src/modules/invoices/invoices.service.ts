import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';

import { PrismaService } from '../../common/database/prisma.service';
import { BrandService } from '../../common/brand/brand.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto';
import { SendInvoiceDto } from './dto/send-invoice.dto';
import { GoogleMailService } from '../google/google-mail.service';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly googleMailService: GoogleMailService,
    private readonly brandService: BrandService,
  ) {}

  async create(userId: string, dto: CreateInvoiceDto) {
    const date = new Date(dto.date);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Ongeldige factuurdatum.');
    }
    return this.prisma.invoice.create({
      data: {
        userId,
        customer: dto.customer.trim(),
        date,
        totalEx: dto.totalEx,
        totalInc: dto.totalInc,
      },
    });
  }

  async listMine(userId: string) {
    return this.prisma.invoice.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
  }

  async listAll(role: UserRole) {
    if (role !== UserRole.MANAGER) {
      throw new ForbiddenException('Alleen managers kunnen alle facturen bekijken.');
    }
    return this.prisma.invoice.findMany({
      orderBy: [
        { status: 'asc' },
        { date: 'desc' },
      ],
      include: {
        user: {
          select: { id: true, email: true, role: true },
        },
      },
    });
  }

  async updateStatus(id: string, role: UserRole, dto: UpdateInvoiceStatusDto) {
    if (role !== UserRole.MANAGER) {
      throw new ForbiddenException('Alleen managers kunnen de factuurstatus wijzigen.');
    }
    return this.prisma.invoice.update({
      where: { id },
      data: {
        status: dto.status,
      },
    });
  }

  async generatePdf(id: string, role: UserRole) {
    if (role !== UserRole.MANAGER) {
      throw new ForbiddenException('Alleen managers mogen facturen genereren.');
    }

    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      throw new NotFoundException('Factuur niet gevonden.');
    }

    const pdfUrl = `stub://invoice/${invoice.id}.pdf`;
    await this.prisma.invoice.update({
      where: { id },
      data: {
        pdfUrl,
        status: invoice.status === 'draft' ? 'sent' : invoice.status,
      },
    });

    return { pdfUrl };
  }

  async sendInvoice(id: string, role: UserRole, dto: SendInvoiceDto) {
    if (role !== UserRole.MANAGER) {
      throw new ForbiddenException('Alleen managers kunnen facturen verzenden.');
    }
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!invoice) {
      throw new NotFoundException('Factuur niet gevonden.');
    }

    const pdfUrl =
      invoice.pdfUrl ??
      (await this.generatePdf(id, role)).pdfUrl;

    const brand = this.brandService.appName;
    try {
      await this.googleMailService.sendEmail(invoice.userId, {
        to: dto.recipientEmail,
        subject: `Factuur ${invoice.id} van ${brand}`,
        body: `Beste ${invoice.customer},

Hierbij ontvang je factuur ${invoice.id}.
Totaal inclusief btw: €${invoice.totalInc.toFixed(2)}.
PDF link: ${pdfUrl}

Met vriendelijke groet,
${brand}`,
      });
    } catch (error) {
      this.logger.warn(`Verzenden van factuur ${invoice.id} mislukt: ${error}`);
      throw new BadRequestException('E-mail verzenden is mislukt.');
    }

    await this.prisma.invoice.update({
      where: { id },
      data: { status: 'sent' },
    });

    return { sent: true, pdfUrl };
  }

  async getInvoice(id: string, userId: string, role: UserRole) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      throw new NotFoundException('Factuur niet gevonden.');
    }
    if (role !== UserRole.MANAGER && invoice.userId !== userId) {
      throw new ForbiddenException('Geen toegang tot deze factuur.');
    }
    return invoice;
  }
}
