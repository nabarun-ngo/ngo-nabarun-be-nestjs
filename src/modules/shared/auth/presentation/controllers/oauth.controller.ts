import {
  Controller,
  Get,
  Query,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GoogleOAuthService } from '../../application/services/google-oauth.service';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { ApiAutoPrimitiveResponse, ApiAutoResponse } from 'src/shared/decorators/api-auto-response.decorator';
import { SuccessResponse } from 'src/shared/models/response-model';
import { AuthTokenDto } from '../../application/dto/oauth..dto';



@ApiTags(OAuthController.name)
@ApiBearerAuth('jwt')
@Controller('auth/oauth')
export class OAuthController {


  constructor(
    private readonly oAuthService: GoogleOAuthService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) { }


  @Get('google/auth-url')
  @ApiOperation({
    summary: 'Get Gmail OAuth authorization URL',
    description:
      'Returns the OAuth URL to redirect users to for Gmail authentication. State parameter is automatically generated server-side for security.',
  })
  @ApiQuery({
    name: 'scopes',
    required: false,
    description: 'Space-separated list of OAuth scopes (must be whitelisted)',
    type: String,
  })
  @ApiQuery({
    name: 'state',
    required: false,
    description: 'Optional custom state parameter (if not provided, secure state will be generated server-side)',
    type: String,
  })
  @ApiAutoResponse(String, { description: 'OAuth URL', wrapInSuccessResponse: true })
  async getGmailAuthUrl(
    @Query('scopes') scopes?: string,
    @Query('state') state?: string,
  ): Promise<SuccessResponse<string>> {
    // Input validation
    if (scopes && scopes.length > 1000) {
      throw new BadRequestException('Scopes parameter is too long. Maximum 1000 characters allowed.');
    }

    // Parse and validate scopes
    const scopeList = scopes
      ? scopes.split(' ').filter(s => s.trim().length > 0)
      : [];

    // Validate scope format (basic check)
    for (const scope of scopeList) {
      if (scope.length > 200) {
        throw new BadRequestException(`Scope "${scope.substring(0, 50)}..." is too long. Maximum 200 characters per scope.`);
      }
    }
    const response = await this.oAuthService.getAuthUrl(scopeList, state);
    return new SuccessResponse<string>(response.url);
  }

  @Get('google/scopes')
  @ApiOperation({ summary: 'Get available Google OAuth scopes' })
  @ApiAutoResponse(Array<String>, { description: 'OAuth scopes', wrapInSuccessResponse: true, isArray: true })
  async getGoogleScopes(): Promise<SuccessResponse<string[]>> {
    return new SuccessResponse<string[]>(this.oAuthService.getOAuthScopes());
  }

  @Get('tokens')
  @ApiOperation({ summary: 'Get available OAuth tokens' })
  @ApiAutoResponse(AuthTokenDto, { description: 'OAuth tokens', wrapInSuccessResponse: true, isArray: true })
  async getGoogleTokens(): Promise<SuccessResponse<Array<AuthTokenDto>>> {
    return new SuccessResponse(
      await this.oAuthService.getTokens()
    );
  }


}

