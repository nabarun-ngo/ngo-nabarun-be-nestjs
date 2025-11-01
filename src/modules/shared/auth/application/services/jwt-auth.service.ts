import {
  Injectable,
  UnauthorizedException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jose from 'jose';
import { Configkey } from 'src/shared/config-keys';

export interface AuthUser {
  sub: string;
  email?: string;
  email_verified?: boolean;
  permissions?: string[];
  roles?: string[];
  iat?: number;
  exp?: number;
  [key: string]: any;
}

@Injectable()
export class JwtAuthService implements OnModuleInit {
 
  private jwks: jose.JWTVerifyGetKey;
  private readonly issuer: string;
  private readonly audience: string;

  constructor(private config: ConfigService) {
    this.audience = this.config.get<string>(Configkey.AUTH0_RESOURCE_API_AUDIENCE)!;
    this.issuer = this.config.get<string>(Configkey.AUTH0_ISSUER_URI)!;

    if (!this.issuer || !this.audience) {
      throw new Error('AUTH0_RESOURCE_API_AUDIENCE and AUTH0_ISSUER_URI must be set');
    }
  }

  onModuleInit() {
    // Create JWKS client using jose
    this.jwks = jose.createRemoteJWKSet(
      new URL(`${this.issuer}.well-known/jwks.json`),
    );
  }

  async verifyToken(token: string): Promise<AuthUser> {
    try {
      // Verify JWT with jose - single function call!
      const { payload } = await jose.jwtVerify(token, this.jwks, {
        issuer: this.issuer,
        audience: this.audience,
        algorithms: ['RS256'], // Auth0 uses RS256
      });

      return payload as AuthUser;
    } catch (error) {
      // jose provides specific error types
      if (error.code === 'ERR_JWT_EXPIRED') {
        throw new UnauthorizedException('Token has expired');
      }
      if (error.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') {
        throw new UnauthorizedException('Invalid token signature');
      }
      if (error.code === 'ERR_JWT_CLAIM_VALIDATION_FAILED') {
        throw new UnauthorizedException('Token claim validation failed');
      }
      throw new UnauthorizedException('Token verification failed');
    }
  }
  
}