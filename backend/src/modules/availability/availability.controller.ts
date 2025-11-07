import { Body, Controller, Get, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AvailabilityService } from './availability.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { UpsertAvailabilityDto } from './dto/upsert-availability.dto';

@ApiTags('Availability')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get()
  list(
    @CurrentUser() user: JwtPayload,
    @Query('userId') userId?: string,
  ) {
    return this.availabilityService.getAvailability(user, userId);
  }

  @Put()
  upsert(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpsertAvailabilityDto,
  ) {
    return this.availabilityService.replaceAvailability(user, dto);
  }
}
