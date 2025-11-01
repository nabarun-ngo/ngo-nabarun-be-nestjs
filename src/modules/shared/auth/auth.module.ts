import { Global, Module } from '@nestjs/common';
import { PermissionsGuard } from './application/guards/permissions.guard';
import { APP_GUARD } from '@nestjs/core';
import { OAuthController } from './presentation/controllers/oauth.controller';
import { GoogleOAuthService } from './application/services/google-oauth.service';
import { TokenRepository } from './infrastructure/persistence/token.repository';
import { TOKEN_REPOSITORY } from './domain/token.repository.interface';
import { JwtAuthService } from './application/services/jwt-auth.service';
import { ApiKeyService } from './application/services/api-key.service';
import { UnifiedAuthGuard } from './application/guards/unified-auth.guard';

@Global()
@Module({
  imports: [
  ],
  controllers: [OAuthController],
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
    GoogleOAuthService,
    JwtAuthService,
    ApiKeyService,
    PermissionsGuard,
    UnifiedAuthGuard
  ],
  exports: [GoogleOAuthService], 
})
export class AuthModule { }

