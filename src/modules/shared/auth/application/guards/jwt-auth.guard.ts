import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JwtAuthService } from '../services/jwt-auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private auth0Service: JwtAuthService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext)  {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    // Verify token - jose handles caching internally
    const user = await this.auth0Service.verifyToken(token);

    // Attach user data to request
    request.user = user;
    request.token = token;

    return true;
  }

  private extractToken(request: any): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader) return null;

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : null;
  }
}