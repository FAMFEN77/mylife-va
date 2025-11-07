import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@prisma/client';
import type { Express } from 'express';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerService, type CsvImportResult } from './customer.service';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateCustomerDto) {
    return this.customerService.create(user, dto);
  }

  @Get()
  list(@CurrentUser() user: JwtPayload, @Query() query: QueryCustomerDto) {
    return this.customerService.findMany(user, query);
  }

  @Get(':id')
  get(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.customerService.findById(user, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customerService.update(user, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.MANAGER)
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async archive(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<void> {
    await this.customerService.archive(user, id);
  }

  @Post(':id/restore')
  @Roles(UserRole.MANAGER)
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  restore(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.customerService.restore(user, id);
  }

  @Post('import/csv')
  @ApiConsumes('multipart/form-data', 'text/plain')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        data: { type: 'string' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  importCsv(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file?: Express.Multer.File,
    @Body('data') data?: string,
  ): Promise<CsvImportResult> {
    const raw = file ? file.buffer.toString('utf8') : data ?? '';
    return this.customerService.importCsv(user, raw);
  }
}
