import { Module } from '@nestjs/common';

import { PrismaModule } from '../../common/database/prisma.module';
import { TeamService } from './team.service';
import { TeamController } from './team.controller';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [PrismaModule, AuthModule, MailModule],
  controllers: [TeamController],
  providers: [TeamService, RolesGuard],
})
export class TeamModule {}
