import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiKeyService } from '../services/api-key.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { USE_API_KEY } from '../decorators/use-api-key.decorator';
import { JwtAuthService } from '../services/jwt-auth.service';

@Injectable()
export class UnifiedAuthGuard implements CanActivate {
  constructor(
    private authService: JwtAuthService,
    private apiKeyService: ApiKeyService,
    private reflector: Reflector,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Check if route explicitly requires API key
    const useApiKey = this.reflector.getAllAndOverride<boolean>(USE_API_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();

    if (useApiKey) {
      // API Key authentication
      return this.validateApiKey(request);
    } else {
      // Default: JWT authentication
      return this.validateJwt(request);
    }
  }

  private async validateJwt(request: any): Promise<boolean> {
    const token = this.extractJwtToken(request);

    if (!token) {
      throw new UnauthorizedException('JWT token is required');
    }

    try {
      const user = await this.authService.verifyToken(token);
      request.user = user;
      request.user.permissions = user.permissions || [];
      request.authType = 'jwt';
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired JWT token');
    }
  }

  private async validateApiKey(request: any): Promise<boolean> {
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }


    const keyInfo = await this.apiKeyService.validateApiKey(apiKey);
    request.user = {
      sub: `apikey:${keyInfo.name}`,
      apiKey: true,
      name: keyInfo.name,
    };
    request.user.permissions = keyInfo.permissions;
    request.apiKeyInfo = keyInfo;
    request.authType = 'apikey';
    return true;
  }

  private extractJwtToken(request: any): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader) return null;

    const [type, token] = authHeader.split(' ');
    // JWT tokens don't start with 'sk_'
    if (type === 'Bearer' && token && !token.startsWith('sk_')) {
      return token;
    }
    return null;
  }

  private extractApiKey(request: any): string | null {
    // Check Authorization header for API key (starts with sk_)
    const authHeader = request.headers.authorization;
    if (authHeader) {
      const [type, key] = authHeader.split(' ');
      if ((type === 'Bearer' || type === 'ApiKey') && key?.startsWith('sk_')) {
        return key;
      }
    }

    // Check X-API-Key header
    const apiKeyHeader = request.headers['x-api-key'];
    if (apiKeyHeader) {
      return apiKeyHeader;
    }

    return null;
  }
}