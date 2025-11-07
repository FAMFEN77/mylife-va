import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WinstonModule } from 'nest-winston';
import { format, transports } from 'winston';
import * as bodyParser from 'body-parser';

const safeStringify = (obj: unknown): string => {
  const cache = new WeakSet<object>();
  return JSON.stringify(obj, (_key, value: unknown) => {
    if (typeof value === 'object' && value !== null) {
      if (cache.has(value as object)) return '[Circular]';
      cache.add(value as object);
    }
    if (value instanceof Error) {
      return { name: value.name, message: value.message, stack: value.stack };
    }
    return value;
  });
};

async function bootstrap(): Promise<void> {
  const logger = WinstonModule.createLogger({
    transports: [
      new transports.Console({
        level: process.env.LOG_LEVEL ?? 'info',
        format: format.combine(
          format.errors({ stack: true }),
          format.timestamp(),
          format.ms(),
          format.printf(({ level, message, context, timestamp, ms, stack, ...meta }) => {
            return safeStringify({ level, message, context, timestamp, ms, stack, ...meta });
          }),
        ),
      }),
    ],
  });

  const app = await NestFactory.create(AppModule, { bufferLogs: true, logger });
  app.useLogger(logger);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 4000;
  const appName = configService.get<string>('APP_BRAND') ?? 'Taskee';

  const allowedOrigins = configService.get<string>('CORS_ALLOWED_ORIGINS')?.split(',') ?? [];
  const allowCredentials = configService.get<string>('APP_CORS_ALLOW_CREDENTIALS') === 'true';

  app.use('/api/v1/billing/webhook', bodyParser.raw({ type: '*/*' }));

  app.enableCors({
    origin: allowedOrigins,
    credentials: allowCredentials,
  });

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle(`${appName} API`)
    .setDescription(`${appName} API voor AI-assistent, taken, reminders en Google-integraties.`)
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  SwaggerModule.setup('swagger', app, SwaggerModule.createDocument(app, swaggerConfig));

  await app.listen(port);
  new Logger('Bootstrap').log(`✅ ${appName} API gestart op poort ${port}`);
}

void bootstrap();
