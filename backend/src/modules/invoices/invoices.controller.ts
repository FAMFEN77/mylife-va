import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { InvoiceResponseDto } from './dto/invoice-response.dto';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto';
import { SendInvoiceDto } from './dto/send-invoice.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateInvoiceDto,
  ): Promise<InvoiceResponseDto> {
    const invoice = await this.invoicesService.create(user.sub, dto);
    return this.toDto(invoice);
  }

  @Get('me')
  async listMine(@CurrentUser() user: JwtPayload): Promise<InvoiceResponseDto[]> {
    const invoices = await this.invoicesService.listMine(user.sub);
    return invoices.map((invoice) => this.toDto(invoice));
  }

  @Get('all')
  async listAll(@CurrentUser() user: JwtPayload) {
    const invoices = await this.invoicesService.listAll(user.role);
    return invoices.map((invoice) => ({
      ...this.toDto(invoice),
      user: invoice.user,
    }));
  }

  @Get(':id')
  async getInvoice(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<InvoiceResponseDto> {
    const invoice = await this.invoicesService.getInvoice(id, user.sub, user.role);
    return this.toDto(invoice);
  }

  @Post(':id/status')
  async updateStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceStatusDto,
  ): Promise<InvoiceResponseDto> {
    const invoice = await this.invoicesService.updateStatus(id, user.role, dto);
    return this.toDto(invoice);
  }

  @Post(':id/generate')
  async generatePdf(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<{ pdfUrl: string }> {
    return this.invoicesService.generatePdf(id, user.role);
  }

  @Post(':id/send')
  async sendInvoice(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: SendInvoiceDto,
  ): Promise<{ sent: boolean; pdfUrl: string }> {
    return this.invoicesService.sendInvoice(id, user.role, dto);
  }

  private toDto(invoice: {
    id: string;
    userId: string;
    customer: string;
    date: Date;
    totalEx: number;
    totalInc: number;
    status: string;
    pdfUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): InvoiceResponseDto {
    return {
      id: invoice.id,
      userId: invoice.userId,
      customer: invoice.customer,
      date: invoice.date.toISOString(),
      totalEx: invoice.totalEx,
      totalInc: invoice.totalInc,
      status: invoice.status,
      pdfUrl: invoice.pdfUrl,
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString(),
    };
  }
}

