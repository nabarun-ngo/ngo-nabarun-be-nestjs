import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { applyConfig, config } from './config/config';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: [config.app.logLevel as any]
  });

  applyConfig(app);
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
  console.log(`Environment: ${config.app.environment} Port: ${config.app.port}`);
  await app.listen(config.app.port, '0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()}`);
  if (!config.app.isProd) {
    console.log(`Swagger documentation (UI): ${await app.getUrl()}/swagger-ui`);
    console.log(`Swagger documentation (API): ${await app.getUrl()}/api/docs`);
  }
}
bootstrap();
