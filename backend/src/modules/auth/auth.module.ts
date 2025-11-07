import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { MailModule } from '../mail/mail.module';
import { PrismaModule } from '../../common/database/prisma.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    MailModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (
        configService: ConfigService,
      ): Promise<JwtModuleOptions> => {
        const expiresInRaw =
          configService.get<string>('app.auth.jwtExpiresIn') ?? '1h';
        const expiresIn: StringValue | number = /^\d+$/.test(expiresInRaw)
          ? Number(expiresInRaw)
          : (expiresInRaw as StringValue);

        return {
          secret:
            configService.get<string>('app.auth.jwtSecret') ?? 'defaultSecret',
          signOptions: { expiresIn },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
