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
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GoogleOAuthService } from '../../application/services/google-oauth.service';
import { Public } from '../../application/decorators/public.decorator';
import { AuthCallbackDto } from '../dto/oauth..dto';
import { IgnoreCaptchaValidation } from '../../application/decorators/ignore-captcha.decorator';



@ApiTags('OAuth')
@ApiBearerAuth()
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
  @ApiResponse({
    status: 200,
    description: 'OAuth authorization URL generated successfully',
    schema: {
      type: 'object',
      properties: {
        authUrl: {
          type: 'string',
          example: 'https://accounts.google.com/o/oauth2/v2/auth?...',
        },
      },
    },
  })
  getGmailAuthUrl(@Query('scopes') scopes: string, @Query('state') state?: string) {
    getGmailAuthUrl(@Query('scopes') scopes?: string, @Query('state') state?: string) {
      const scopeList = scopes ? scopes.split(' ') : [];
      return this.oAuthService.getAuthUrl(scopeList, state);
    }

  @Get('google/scopes')
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
  @ApiResponse({
    status: 200,
    description: 'Gmail authentication successful, tokens stored',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        email: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid OAuth code or callback data',
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

