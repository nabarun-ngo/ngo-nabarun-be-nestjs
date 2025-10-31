import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function configureSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('NABARUN')
    .setDescription('NABARUN Backend API powered by NestJS')
    .setVersion('2.0')
    .addBearerAuth()
    .addApiKey({
      type: 'apiKey',
      in: 'header',
      name: 'X-Api-Key',
      description: 'API Key needed to access the endpoints'
    })
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, documentFactory);
}
