import {
  Controller,
  Get,
  Query,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GoogleOAuthService } from '../../application/services/google-oauth.service';
import { AuthCallbackDto } from '../dto/oauth..dto';
import { ApiAutoPrimitiveResponse } from 'src/shared/decorators/api-auto-response.decorator';



@ApiTags('OAuth')
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
      'Returns the OAuth URL to redirect users to for Gmail authentication',
  })
  @ApiQuery({
    name: 'state',
    required: false,
    description: 'Optional state parameter for OAuth flow',
  })
  getGmailAuthUrl(@Query('scopes') scopes: string, @Query('state') state?: string) {
    const scopeList = scopes ? scopes.split(' ') : [];
    return this.oAuthService.getAuthUrl(scopeList, state);
  }

  @Get('google/scopes')
  @ApiOperation({ summary: 'Get available Google OAuth scopes' })
  getGoogleScopes() {
    return this.oAuthService.getOAuthScopes();
  }


  @Post('google/submit-callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Handle Gmail OAuth callback',
    description:
      'Processes the OAuth callback code and stores the authentication tokens. Email can be provided in body or will be fetched from Google.',
  })
  async handleGmailCallback(
    @Body() callbackDto: AuthCallbackDto,
  ) {
    // Email is optional - will be fetched from Google if not provided
    const result = await this.oAuthService.handleCallback(
      callbackDto.code,
      callbackDto.clientId,
    );
    return result;
  }



}

