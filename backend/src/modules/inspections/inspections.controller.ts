import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { InspectionsService } from './inspections.service';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { InspectionResponseDto } from './dto/inspection-response.dto';
import { ListInspectionsQueryDto } from './dto/list-inspections-query.dto';
import { SendInspectionReportDto } from './dto/send-inspection-report.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Inspections')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inspections')
export class InspectionsController {
  constructor(private readonly inspectionsService: InspectionsService) {}

  @Post()
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateInspectionDto,
  ): Promise<InspectionResponseDto> {
    const inspection = await this.inspectionsService.create(user, dto);
    return this.toDto(inspection);
  }

  @Get()
  async list(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListInspectionsQueryDto,
  ) {
    const inspections = await this.inspectionsService.list(user, query);
    return inspections.map((inspection) => ({
      ...this.toDto(inspection),
      inspector: inspection.inspector,
    }));
  }

  @Get(':id')
  async getById(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<InspectionResponseDto> {
    const inspection = await this.inspectionsService.getById(id, user);
    return this.toDto(inspection);
  }

  @Post(':id/generate-pdf')
  async generatePdf(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<{ pdfUrl: string }> {
    return this.inspectionsService.generatePdf(id, user);
  }

  @Post(':id/send-report')
  async sendReport(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: SendInspectionReportDto,
  ): Promise<{ sent: boolean; pdfUrl: string }> {
    return this.inspectionsService.sendReport(id, user, dto);
  }

  private toDto(inspection: {
    id: string;
    inspectorId: string;
    location: string;
    date: Date;
    notes: string | null;
    pdfUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    items: Array<{
      id: string;
      description: string;
      score: number;
      notes: string | null;
    }>;
  }): InspectionResponseDto {
    return {
      id: inspection.id,
      inspectorId: inspection.inspectorId,
      location: inspection.location,
      date: inspection.date.toISOString(),
      notes: inspection.notes,
      pdfUrl: inspection.pdfUrl,
      createdAt: inspection.createdAt.toISOString(),
      updatedAt: inspection.updatedAt.toISOString(),
      items: inspection.items.map((item) => ({
        id: item.id,
        description: item.description,
        score: item.score,
        notes: item.notes,
      })),
    };
  }
}

