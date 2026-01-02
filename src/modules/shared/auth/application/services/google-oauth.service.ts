import { Inject, Injectable, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client, } from 'google-auth-library';
import { Configkey } from 'src/shared/config-keys';
import { TOKEN_REPOSITORY, type ITokenRepository } from '../../domain/repository/token.repository.interface';
import { AuthToken } from '../../domain/models/auth-token.model';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { randomBytes } from 'crypto';
import { OauthMapper } from '../dto/mapper/oauth.mapper';
import { SlackNotificationRequestEvent } from 'src/modules/shared/correspondence/events/slack-notification-request.event';

@Injectable()
export class GoogleOAuthService {
  private readonly logger = new Logger(GoogleOAuthService.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly oauth2Client: OAuth2Client;

  private readonly RATE_LIMIT_PREFIX = 'oauth:ratelimit:';
  private readonly RATE_LIMIT_TTL = 60 * 1000; // 1 minute
  private readonly RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute per user

  // Whitelist of allowed OAuth scopes to prevent privilege escalation
  private readonly allowedScopes: string[] = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/gmail.send',
    'openid',
    'email',
    'profile',
  ];

  // Cache keys
  private readonly STATE_CACHE_PREFIX = 'oauth:state:';
  private readonly CODE_CACHE_PREFIX = 'oauth:code:';

  // TTL values (in milliseconds)
  private readonly STATE_TTL = 10 * 60 * 1000; // 10 minutes
  private readonly CODE_TTL = 10 * 60 * 1000; // 10 minutes (authorization codes expire quickly)


  constructor(
    private readonly configService: ConfigService,
    @Inject(TOKEN_REPOSITORY) private readonly tokenRepository: ITokenRepository,
    private readonly eventEmitter: EventEmitter2,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    this.clientId = this.configService.get<string>(Configkey.GOOGLE_CLIENT_ID)!;
    this.clientSecret = this.configService.get<string>(
      Configkey.GOOGLE_CLIENT_SECRET,
    )!;
    this.redirectUri = this.configService.get<string>(Configkey.GOOGLE_REDIRECT_URI)!;

    if (!this.clientId || !this.clientSecret) {
      throw new Error(
        'Google OAuth credentials are missing. Please configure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET',
      );
    }
    this.oauth2Client = new OAuth2Client({
      clientId: this.clientId,
      clientSecret: this.clientSecret,
      redirectUri: this.redirectUri
    });

  }

  async getTokens() {
    return (await this.tokenRepository.findAll()).map(OauthMapper.toDto)
  }

  /**
   * Validate scopes against whitelist to prevent privilege escalation
   */
  private validateScopes(scopes: string[]): void {
    const invalidScopes = scopes.filter(scope => !this.allowedScopes.includes(scope));
    if (invalidScopes.length > 0) {
      throw new BadRequestException(
        `Invalid scopes requested: ${invalidScopes.join(', ')}. Only whitelisted scopes are allowed.`
      );
    }
  }

  /**
   * Generate cryptographically secure state parameter
   */
  private generateState(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Store state in cache for validation
   */
  private async storeState(
    state: string,
    userId?: string,
  ): Promise<void> {
    const cacheKey = `${this.STATE_CACHE_PREFIX}${state}`;
    await this.cacheManager.set(
      cacheKey,
      {
        userId,
        timestamp: Date.now(),
      },
      this.STATE_TTL
    );
  }

  /**
     * Simple rate limiting using cache
     */
  public async checkRateLimit(identifier: string): Promise<void> {
    const cacheKey = `${this.RATE_LIMIT_PREFIX}${identifier}`;
    const currentCount = await this.cacheManager.get<number>(cacheKey) || 0;

    if (currentCount >= this.RATE_LIMIT_MAX_REQUESTS) {
      throw new BadRequestException('Rate limit exceeded. Please try again later.');
    }

    await this.cacheManager.set(cacheKey, currentCount + 1, this.RATE_LIMIT_TTL);
  }

  /**
   * Validate and consume state from cache
   */
  private async validateAndConsumeState(state: string): Promise<void> {
    if (!state) {
      throw new BadRequestException('State parameter is required for security');
    }

    const cacheKey = `${this.STATE_CACHE_PREFIX}${state}`;
    const storedState = await this.cacheManager.get<{
      userId?: string;
      timestamp: number;
    }>(cacheKey);

    if (!storedState) {
      throw new UnauthorizedException('Invalid or expired state parameter. Please restart the OAuth flow.');
    }

    // Consume state (delete from cache) to prevent reuse
    await this.cacheManager.del(cacheKey);
  }

  /**
   * Check if authorization code has been used
   */
  private async isCodeUsed(code: string): Promise<boolean> {
    const cacheKey = `${this.CODE_CACHE_PREFIX}${code}`;
    const used = await this.cacheManager.get<boolean>(cacheKey);
    return used === true;
  }

  /**
   * Mark authorization code as used
   */
  private async markCodeAsUsed(code: string): Promise<void> {
    const cacheKey = `${this.CODE_CACHE_PREFIX}${code}`;
    await this.cacheManager.set(cacheKey, true, this.CODE_TTL);
  }

  /**
   * Generate OAuth authorization URL with secure state generation
   * @param scopes - Array of OAuth scopes to request
   * @param state - Optional custom state (if not provided, secure state will be generated)
   */
  async getAuthUrl(
    scopes: string[],
    state?: string,
  ): Promise<{ url: string; state: string; }> {
    // Validate requested scopes against whitelist
    // Always include userinfo scopes and openid scopes
    const defaultScopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ];
    const requestedScopes = [...new Set([...defaultScopes, ...scopes, 'openid', 'email', 'profile'])];
    this.validateScopes(requestedScopes);

    // Generate secure state server-side if not provided
    const secureState = state || this.generateState();

    // Store state in cache for validation on callback
    await this.storeState(secureState);

    const url = this.oauth2Client.generateAuthUrl({
      access_type: 'offline', // Required to get refresh token
      scope: requestedScopes,
      prompt: 'consent', // Force consent to get refresh token
      state: secureState,
      response_type: 'code',
      include_granted_scopes: true,
    });

    this.logger.log(`Generated OAuth URL for Google authentication with state: ${secureState.substring(0, 8)}...`);
    return { url: url, state: secureState };
  }

  getOAuthScopes() {
    return this.allowedScopes;
  }

  /**
   * Exchange authorization code for tokens and store them
   * Validates state parameter and prevents code reuse
   * Returns success status and frontend redirect URL if stored in state
   */
  async handleCallback(
    code: string,
    state: string,
  ): Promise<{
    success: boolean;
    email?: string;
    error?: string;
  }> {
    try {
      // Validate state parameter (CSRF protection)
      await this.validateAndConsumeState(state);

      // Check if authorization code has already been used (prevent reuse)
      if (await this.isCodeUsed(code)) {
        throw new BadRequestException('Authorization code has already been used. Please restart the OAuth flow.');
      }

      // Exchange code for tokens
      const { tokens } = await this.oauth2Client.getToken(code);

      // Mark code as used immediately after successful exchange
      await this.markCodeAsUsed(code);

      if (!tokens.access_token) {
        throw new Error('No access token received');
      }

      // If email not provided, fetch from Google userinfo

      this.oauth2Client.setCredentials({
        access_token: tokens.access_token,
      });

      // Verify and decode ID token
      const ticket = await this.oauth2Client.verifyIdToken({
        idToken: tokens.id_token!,
        audience: this.clientId,
      });

      const payload = ticket.getPayload();
      const email = payload?.email;

      if (!email) {
        throw new Error('Could not retrieve email from Google userinfo');
      }
      // Encrypt tokens
      const encryptionKey = this.configService.get<string>(
        Configkey.APP_SECRET
      )!;
      const authToken = await AuthToken.create({
        clientId: this.clientId,
        provider: 'google',
        email: email!,
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token!,
        tokenType: tokens.token_type || 'Bearer',
        expiresAt: tokens.expiry_date!,
        scope: tokens.scope!,
      }, encryptionKey);
      await this.tokenRepository.create(authToken);
      this.logger.log(
        `Successfully stored OAuth tokens`,
      );

      return {
        success: true,
        email: email,
      };
    } catch (error) {
      this.logger.error(
        `Failed to handle OAuth callback: ${error.message}`,
        error.stack,
      );

      // Return error info
      const errorResponse: {
        success: boolean;
        error: string;
      } = {
        success: false,
        error: error instanceof BadRequestException || error instanceof UnauthorizedException
          ? error.message
          : 'Failed to process OAuth callback. Please try again.',
      };

      // Re-throw as appropriate exception types (for API responses)
      if (error instanceof BadRequestException || error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException(errorResponse.error);
    }
  }

  /**
   * Get valid access token for a user (refresh if needed)
   */
  private async getValidAccessToken(clientId: string, scope: string): Promise<string> {

    const tokenRecord = await this.tokenRepository.findByAttribute({
      clientId: clientId,
      provider: 'google',
      scope: scope,
    });

    if (!tokenRecord) {
      this.eventEmitter.emit(SlackNotificationRequestEvent.name, {
        message: `No OAuth token found with scope ${scope}. Please login to admin portal and create a new token with the mentioned scope.`,
        type: 'error',
      });
      throw new Error(
        `No OAuth token found with scope ${scope}. Please ask admin to authenticate first.`,
      );
    }

    // Check if token is expired or will expire soon (within 5 minutes)
    if (tokenRecord.isExpired()) {
      this.logger.log(
        `Refreshing access token`,
      );
      await this.refreshAccessToken(tokenRecord);
    }
    const encryptionKey = this.configService.get<string>(
      Configkey.APP_SECRET
    )!;
    return await tokenRecord.getAccessToken(encryptionKey);
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(tokenRecord: AuthToken): Promise<string> {
    if (!tokenRecord || !tokenRecord.refreshToken) {
      throw new Error(
        `No refresh token available. Please ask admin to authenticate first.`,
      );
    }

    // Decrypt refresh token
    const encryptionKey = this.configService.get<string>(
      Configkey.APP_SECRET
    )!;
    // Set refresh token and get new access token
    this.oauth2Client.setCredentials({
      refresh_token: await tokenRecord.getRefreshToken(encryptionKey),
    });

    const { credentials } = await this.oauth2Client.refreshAccessToken();

    if (!credentials.access_token) {
      throw new Error('Failed to refresh access token');
    }
    await tokenRecord.update({
      accessToken: credentials.access_token!,
      expiresAt: credentials.expiry_date!
    }, encryptionKey)
    // Encrypt and update token
    await this.tokenRepository.update(tokenRecord.id, tokenRecord);
    this.logger.log(
      `Successfully refreshed access token`,
    );

    return credentials.access_token;
  }

  /**
   * Revoke tokens for a user
   */
  async revokeTokens(id: string, email: string): Promise<void> {
    const tokenRecord = await this.tokenRepository.findById(id);
    if (!tokenRecord) {
      return;
    }

    // Decrypt access token to revoke
    const encryptionKey = this.configService.get<string>(
      Configkey.APP_SECRET
    )!;
    try {
      await this.oauth2Client.revokeToken(await tokenRecord.getAccessToken(encryptionKey));
      this.logger.log(`Revoked token`);
    } catch (error) {
      this.logger.warn(
        `Failed to revoke token (may already be revoked): ${error.message}`,
      );
    }

    await this.tokenRepository.delete(tokenRecord.id);

    this.logger.log(`Deleted token record`);
  }

  /**
   * Get OAuth2Client with valid credentials for a user
   */
  async getAuthenticatedClient(
    scope: string,
    clientId: string = this.clientId,
  ): Promise<OAuth2Client | null> {
    try {
      const accessToken = await this.getValidAccessToken(clientId, scope);
      this.oauth2Client.setCredentials({
        access_token: accessToken,
      });
      return this.oauth2Client;
    } catch (error) {
      this.logger.fatal(
        `Failed to get authenticated client: ${error.message}`,
        error.stack,
      );
      return null
    }

  }
}
