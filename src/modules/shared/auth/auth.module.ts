import { Global, Module } from '@nestjs/common';
import { JwtAuthGuard } from './application/guards/auth.guard';
import { PermissionsGuard } from './application/guards/permissions.guard';
import { APP_GUARD } from '@nestjs/core';
import { OAuthController } from './presentation/controllers/oauth.controller';
import { GoogleOAuthService } from './application/services/google-oauth.service';
import { TokenRepository } from './infrastructure/persistence/token.repository';
import { TOKEN_REPOSITORY } from './domain/token.repository.interface';
import { AuthService } from './application/services/auth.service';

@Global()
@Module({
  imports: [
  ],
  controllers: [OAuthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    {
      provide: TOKEN_REPOSITORY,
      useClass: TokenRepository,
    },
    GoogleOAuthService, AuthService, JwtAuthGuard, PermissionsGuard
  ],
  exports: [GoogleOAuthService, JwtAuthGuard, PermissionsGuard],
})
export class AuthModule { }

