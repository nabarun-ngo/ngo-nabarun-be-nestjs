import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiKeyService } from '../services/api-key.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private apiKeyService: ApiKeyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    try {
      const keyInfo = await this.apiKeyService.validateApiKey(apiKey);

      // Attach API key info to request (similar to JWT user)
      request.user = {
        sub: `apikey:${keyInfo.name}`,
        apiKey: true,
        name: keyInfo.name,
      };
      request.permissions = keyInfo.permissions;
     // request.roles = keyInfo.roles;
      request.apiKeyInfo = keyInfo;
      request.authType = 'apikey';

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid API key');
    }
  }

  private extractApiKey(request: any): string | null {
    // Support multiple ways to send API key

    // 1. Authorization header: "Bearer sk_xxx" or "ApiKey sk_xxx"
    const authHeader = request.headers.authorization;
    if (authHeader) {
      const [type, key] = authHeader.split(' ');
      if ((type === 'Bearer' || type === 'ApiKey') && key?.startsWith('sk_')) {
        return key;
      }
    }

    // 2. Custom header: "X-API-Key: sk_xxx"
    const apiKeyHeader = request.headers['x-api-key'];
    if (apiKeyHeader) {
      return apiKeyHeader;
    }

    // 3. Query parameter: ?api_key=sk_xxx (not recommended, but supported)
    const apiKeyQuery = request.query.api_key;
    if (apiKeyQuery) {
      return apiKeyQuery;
    }

    return null;
  }
}