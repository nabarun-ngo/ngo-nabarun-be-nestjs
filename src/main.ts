import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import compression from 'compression';

async function bootstrap() {
  const isProd = process.env.NODE_ENV === 'prod';

  const app = await NestFactory.create(AppModule, {
    logger: isProd
      ? ['error', 'warn', 'fatal']
      : ['debug', 'log', 'error', 'fatal', 'warn'], // Minimal logging in production
    bufferLogs: true,
  });

  // Memory optimization
  app.use(compression()); // Response compression

  // Global validation with transform and whitelist
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      // Disable detailed errors in prod for performance
      disableErrorMessages: isProd,
    }),
  );

  // CORS for production
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
  });

  // Graceful shutdown for Cloud Run
  app.enableShutdownHooks();

  const port = process.env.PORT || 8080;
  await app.listen(port, '0.0.0.0');
  console.log(`Application running on port ${port}`);
}
bootstrap();
