import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { TripResponseDto } from './dto/trip-response.dto';
import { ListTripsQueryDto } from './dto/list-trips-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Trips')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Post()
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateTripDto,
  ): Promise<TripResponseDto> {
    const trip = await this.tripsService.createForUser(user.sub, dto);
    return this.toDto(trip);
  }

  @Get('me')
  async listMine(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListTripsQueryDto,
  ): Promise<TripResponseDto[]> {
    const trips = await this.tripsService.listMine(user.sub, query);
    return trips.map((trip) => this.toDto(trip));
  }

  @Get('pending')
  async listPending(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListTripsQueryDto,
  ): Promise<Array<TripResponseDto & { user: { id: string; email: string; role: string } }>> {
    const trips = await this.tripsService.listPending(user.role, query);
    return trips.map((trip) => ({
      ...this.toDto(trip),
      user: trip.user,
    }));
  }

  @Post(':id/approve')
  async approve(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<TripResponseDto> {
    const trip = await this.tripsService.approve(id, user.role, true);
    return this.toDto(trip);
  }

  @Post(':id/reject')
  async reject(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<TripResponseDto> {
    const trip = await this.tripsService.approve(id, user.role, false);
    return this.toDto(trip);
  }

  private toDto(trip: {
    id: string;
    userId: string;
    date: Date;
    from: string;
    to: string;
    distanceKm: number;
    approved: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): TripResponseDto {
    return {
      id: trip.id,
      userId: trip.userId,
      date: trip.date.toISOString(),
      from: trip.from,
      to: trip.to,
      distanceKm: trip.distanceKm,
      approved: trip.approved,
      createdAt: trip.createdAt.toISOString(),
      updatedAt: trip.updatedAt.toISOString(),
    };
  }
}

