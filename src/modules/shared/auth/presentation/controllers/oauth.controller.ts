import {
  Controller,
  Get,
  Query,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiParam,
  ApiProperty,
} from '@nestjs/swagger';
import { GoogleOAuthService } from '../../application/services/google-oauth.service';
import { Public } from '../../application/decorators/public.decorator';
import { IsOptional, IsString } from 'class-validator';

class AuthCallbackDto {
  @IsString()
  @ApiProperty()
  code: string;
  @ApiProperty()
  @IsOptional()
  state?: string;
  @IsString()
  @ApiProperty()
  clientId: string;
}

@ApiTags('OAuth')
@ApiBearerAuth()
@Controller('oauth')
export class OAuthController {
  constructor(
    private readonly oAuthService: GoogleOAuthService,
  ) { }

  @Public()
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
  getGmailAuthUrl(@Query('state') state?: string) {
    return this.oAuthService.getAuthUrl(state);
  }

  @Public()
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

