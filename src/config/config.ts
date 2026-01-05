import { INestApplication, NestInterceptor, RequestMethod, ValidationPipe } from "@nestjs/common";
import compression from "compression";
import { configureSwagger } from "./swagger-config";
import { Configkey } from "src/shared/config-keys";
import { GlobalExceptionFilter } from "src/shared/filters/global-exception.filter";
import * as bodyParser from 'body-parser';
import { TimingInterceptor } from "src/shared/interceptors/timing.interceptor";

export const config = {
  app: {
    name: process.env[Configkey.APP_NAME] || '',
    port: parseInt(process.env.PORT || '8080'),
    environment: process.env[Configkey.NODE_ENV] || 'development',
    isProd: process.env[Configkey.NODE_ENV] === 'prod',
    logLevel: process.env[Configkey.LOG_LEVEL] || 'log',
    fileSize: '10mb',
  },
  database: {
    mongodbUrl: process.env[Configkey.MONGODB_URL],
    postgresUrl: process.env[Configkey.POSTGRES_URL],
    redisUrl: process.env[Configkey.REDIS_URL],
  },
  cors: {
    origin: process.env[Configkey.CORS_ALLOWED_ORIGIN]?.split(','),
    credentials: true,
  },
  validation: new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: false,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
    disableErrorMessages: process.env.NODE_ENV === 'prod',
  }),
};

export function applyConfig(app: INestApplication) {
  app.use(compression()); // Response compression

  // Global validation with transform and whitelist
  app.useGlobalPipes(config.validation);

  // Set global prefix BEFORE configuring Swagger so it picks up the prefix
  app.setGlobalPrefix('api', {
    exclude: [
      {
        path: '/callback/oauth/google',
        method: RequestMethod.GET
      }
    ]
  });

  // File Size configuration
  app.use(bodyParser.json({ limit: config.app.fileSize }));
  app.use(bodyParser.urlencoded({ limit: config.app.fileSize, extended: true }));

  // Global Interceptors
  let interceptors: NestInterceptor<any, any>[] = [];

  if (!config.app.isProd) {
    configureSwagger(app);
    interceptors.push(new TimingInterceptor());
  }

  app.enableCors(config.cors);
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(...interceptors);

  app.enableShutdownHooks();
}
