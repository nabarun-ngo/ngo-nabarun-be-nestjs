import { Global, Module } from '@nestjs/common';
import { PermissionsGuard } from './application/guards/permissions.guard';
import { APP_GUARD } from '@nestjs/core';
import { OAuthController } from './presentation/controllers/oauth.controller';
import { GoogleOAuthService } from './application/services/google-oauth.service';
import { TokenRepository } from './infrastructure/persistence/token.repository';
import { TOKEN_REPOSITORY } from './domain/repository/token.repository.interface';
import { JwtAuthService } from './application/services/jwt-auth.service';
import { ApiKeyService } from './application/services/api-key.service';
import { UnifiedAuthGuard } from './application/guards/unified-auth.guard';
import { ApiKeyRepository } from './infrastructure/persistence/api-key.repository';
import { ApiKeyController } from './presentation/controllers/api-key.controller';
import { ApiKeyEventsHandler } from './application/handler/api-key-events.handler';
import { API_KEY_REPOSITORY } from './domain/repository/api-key.repository.interface';

@Global()
@Module({
  imports: [
  ],
  controllers: [OAuthController,ApiKeyController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: UnifiedAuthGuard ,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    {
      provide: TOKEN_REPOSITORY,
      useClass: TokenRepository,
    },
    {
      provide: API_KEY_REPOSITORY,
      useClass: ApiKeyRepository,
    },
    GoogleOAuthService,
    JwtAuthService,
    ApiKeyService,
    PermissionsGuard,
    UnifiedAuthGuard,
    ApiKeyEventsHandler
  ],
  exports: [GoogleOAuthService], 
})
export class AuthModule { }

