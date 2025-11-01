// import { Injectable, UnauthorizedException } from '@nestjs/common';
// import { PassportStrategy } from '@nestjs/passport';
// import { ExtractJwt, Strategy } from 'passport-jwt';
// import { passportJwtSecret } from 'jwks-rsa';
// import { ConfigService } from '@nestjs/config';

// export interface JwtPayload {
//   sub: string;
//   iss: string;
//   aud: string | string[];
//   iat: number;
//   exp: number;
//   azp?: string;
//   scope?: string;
//   permissions?: string[];
//   [key: string]: any;
// }

// @Injectable()
// export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
//   constructor(private configService: ConfigService) {
//     const issuer = configService.get<string>('AUTH0_ISSUER_URI');
//     const audience = configService.get<string>('AUTH0_RESOURCE_API_AUDIENCE');

//     if (!issuer || !audience) {
//       throw new Error(
//         'AUTH0_ISSUER_URI and AUTH0_RESOURCE_API_AUDIENCE must be configured',
//       );
//     }

//     super({
//       secretOrKeyProvider: passportJwtSecret({
//         cache: true,
//         rateLimit: true,
//         jwksRequestsPerMinute: 5,
//         jwksUri: `${issuer}.well-known/jwks.json`,
//       }),
//       jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
//       audience: audience,
//       issuer: issuer,
//       algorithms: ['RS256'],
//     });
//   }

//   async validate(payload: JwtPayload) {
//     if (!payload) {
//       throw new UnauthorizedException('Invalid token payload');
//     }

//     // Return user information that will be attached to request.user
//     return {
//       userId: payload.sub,
//       permissions: payload.permissions || [],
//       scope: payload.scope,
//       ...payload,
//     };
//   }
// }

