import { DocumentBuilder, SwaggerModule, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { Configkey } from 'src/shared/config-keys';
import { SuccessResponse, ErrorResponse } from 'src/shared/models/response-model';
import { PagedResult } from 'src/shared/models/paged-result';
// DTOs used widely as output models
import { UserDto, PhoneNumberDto, AddressDto, LinkDto, RoleDto } from 'src/modules/user/application/dto/user.dto';
import { DonationDto } from 'src/modules/finance/application/dto/donation.dto';
import { DocumentDto } from 'src/modules/shared/dms/presentation/dto/document.dto';
// Add more DTO imports as needed

export function configureSwagger(app: INestApplication) {
  const globalPrefix = 'api';
  
  const config = new DocumentBuilder()
    .setTitle(process.env[Configkey.APP_NAME] || 'API Documentation')
    .setDescription(`${process.env[Configkey.APP_NAME]} Backend API powered by NestJS` )
    .setVersion('2.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'jwt',
    )
    .addApiKey({
      type: 'apiKey',
      in: 'header',
      name: 'X-Api-Key',
      description: 'API Key needed to access the endpoints',
    }, 'api-key')
    .build();

  // Register extra models so they appear in the generated OpenAPI doc even if only referenced generically
  // The Swagger plugin will automatically infer types from method signatures, but we need to register
  // commonly used models here for generic types like SuccessResponse<T> and PagedResult<T>
  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [
      SuccessResponse,
      ErrorResponse,
      PagedResult,
      // User-related DTOs
      UserDto,
      PhoneNumberDto,
      AddressDto,
      LinkDto,
      RoleDto,
      // Add more DTOs as they are used in controllers
      // The @ApiAutoResponse decorator will automatically register models via @ApiExtraModels
    ],
    // Enable deep scan for better type inference
    deepScanRoutes: true,
  });

  SwaggerModule.setup('api/docs', app, document);
}
