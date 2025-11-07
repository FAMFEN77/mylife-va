import { Module } from '@nestjs/common';

import { PrismaModule } from '../../common/database/prisma.module';
import { RoomReservationsService } from './room-reservations.service';

@Module({
  imports: [PrismaModule],
  providers: [RoomReservationsService],
  exports: [RoomReservationsService],
})
export class RoomsModule {}

