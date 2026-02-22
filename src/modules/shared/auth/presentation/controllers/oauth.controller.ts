import {
  Controller,
  Get,
  Query,
  BadRequestException,
  Inject,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GoogleOAuthService } from '../../application/services/google-oauth.service';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { ApiAutoPagedResponse, ApiAutoPrimitiveResponse, ApiAutoResponse } from 'src/shared/decorators/api-auto-response.decorator';
import { SuccessResponse } from 'src/shared/models/response-model';
import { AuthTokenDto } from '../../application/dto/oauth..dto';
import { RequirePermissions } from '../../application/decorators/require-permissions.decorator';
import { PagedResult } from 'src/shared/models/paged-result';



@ApiTags(OAuthController.name)
@ApiBearerAuth('jwt')
@Controller('auth/oauth')
export class OAuthController {

  constructor(
    private readonly oAuthService: GoogleOAuthService,
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
  @RequirePermissions('create:oauth_token')
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
  @ApiAutoResponse(String, { description: 'OAuth scopes', wrapInSuccessResponse: true, isArray: true })
  async getGoogleScopes(): Promise<SuccessResponse<string[]>> {
    return new SuccessResponse<string[]>(this.oAuthService.getOAuthScopes());
  }

  @Get('tokens')
  @ApiOperation({ summary: 'Get available OAuth tokens' })
  @RequirePermissions('read:oauth_token')
  @ApiQuery({ name: 'pageIndex', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiAutoPagedResponse(AuthTokenDto, { description: 'OAuth tokens', wrapInSuccessResponse: true })
  async getGoogleTokens(
    @Query('pageIndex') pageIndex: number,
    @Query('pageSize') pageSize: number,
  ): Promise<SuccessResponse<PagedResult<AuthTokenDto>>> {
    return new SuccessResponse(
      await this.oAuthService.getTokens({ pageIndex, pageSize, props: {} })
    );
  }

  @Get('tokens/:id/revoke')
  @ApiOperation({ summary: 'Revoke OAuth tokens' })
  @ApiAutoResponse(String, { description: 'OAuth tokens', wrapInSuccessResponse: true })
  @RequirePermissions('delete:oauth_token')
  async revokeGoogleTokens(@Param('id') id: string): Promise<SuccessResponse<string>> {
    await this.oAuthService.revokeTokens(id)
    return new SuccessResponse('Token revoked successfully.');
  }

}

