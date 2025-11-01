import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiKeyService } from '../services/api-key.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JwtAuthService } from '../services/jwt-auth.service';

@Injectable()
export class JwtOrApiKeyGuard implements CanActivate {
  constructor(
    private auth0Service: JwtAuthService,
    private apiKeyService: ApiKeyService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    // Try JWT first
    const jwtToken = this.extractJwtToken(request);
    if (jwtToken) {
      try {
        const user = await this.auth0Service.verifyToken(jwtToken);
        request.user = user;
        request.permissions = user.permissions || [];
        request.authType = 'jwt';
        return true;
      } catch (error) {
        // JWT failed, try API key
      }
    }

    // Try API Key
    const apiKey = this.extractApiKey(request);
    if (apiKey) {
      try {
        const keyInfo = await this.apiKeyService.validateApiKey(apiKey);
        request.user = {
          sub: `apikey:${keyInfo.name}`,
          apiKey: true,
          name: keyInfo.name,
        };
        request.permissions = keyInfo.permissions;
        request.roles = keyInfo.roles;
        request.apiKeyInfo = keyInfo;
        request.authType = 'apikey';
        return true;
      } catch (error) {
        // API key failed
      }
    }

    throw new UnauthorizedException(
      'Valid JWT token or API key is required',
    );
  }

  private extractJwtToken(request: any): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader) return null;

    const [type, token] = authHeader.split(' ');
    if (type === 'Bearer' && !token.startsWith('sk_')) {
      return token;
    }
    return null;
  }

  private extractApiKey(request: any): string | null {
    // Check Authorization header for API key
    const authHeader = request.headers.authorization;
    if (authHeader) {
      const [type, key] = authHeader.split(' ');
      if ((type === 'Bearer' || type === 'ApiKey') && key.startsWith('sk_')) {
        return key;
      }
    }

    // Check X-API-Key header
    const apiKeyHeader = request.headers['x-api-key'];
    if (apiKeyHeader) {
      return apiKeyHeader;
    }

    // Check query parameter
    const apiKeyQuery = request.query.api_key;
    if (apiKeyQuery) {
      return apiKeyQuery;
    }

    return null;
  }
}