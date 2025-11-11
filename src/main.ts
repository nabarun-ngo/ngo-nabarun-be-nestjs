import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import compression from 'compression';
import { configureSwagger } from './config/swagger-config';

async function bootstrap() {
  const isProd = process.env.NODE_ENV === 'prod';
  const app = await NestFactory.create(AppModule, {
    logger: ['log'],
    // Minimal logging in production
    //bufferLogs: false,
  });

  app.use(compression()); // Response compression

  // Global validation with transform and whitelist
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: isProd,
    }),
  );

  configureSwagger(app);
  app.enableCors();
  //app.useGlobalFilters(new GlobalExceptionFilter());
  app.enableShutdownHooks();
  app.setGlobalPrefix('api');
  console.log(`Environment: ${process.env.NODE_ENV} Port: ${process.env.PORT}`);
  const port = process.env.PORT || 8080;
  await app.listen(port, '0.0.0.0');

  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Swagger documentation: ${await app.getUrl()}/api/docs`);
}
bootstrap();
