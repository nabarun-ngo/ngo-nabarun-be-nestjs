import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client, } from 'google-auth-library';
import { Configkey } from 'src/shared/config-keys';
import { TOKEN_REPOSITORY, type ITokenRepository } from '../../domain/repository/token.repository.interface';
import { AuthToken } from '../../domain/models/auth-token.model';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GmailService } from 'src/modules/shared/correspondence/services/gmail.service';

@Injectable()
export class GoogleOAuthService {
  private readonly logger = new Logger(GoogleOAuthService.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly oauth2Client: OAuth2Client;
  private readonly defaultScopes: string[] = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];


  constructor(
    private readonly configService: ConfigService,
    @Inject(TOKEN_REPOSITORY) private readonly tokenRepository: ITokenRepository,
    private readonly eventEmitter: EventEmitter2
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

  /**
   * Generate OAuth authorization URL
   */
  getAuthUrl(scopes: string[],state?: string): { url: string; state: string | undefined; clientId: string } {

    const url = this.oauth2Client.generateAuthUrl({
      access_type: 'offline', // Required to get refresh token
      scope: [...this.defaultScopes, ...scopes, 'openid', 'email', 'profile'],
      prompt: 'consent', // Force consent to get refresh token
      state: state || undefined,
      response_type: 'code',
      include_granted_scopes: true,
    });

    this.logger.log(`Generated OAuth URL for Google authentication`);
    return { url: url, state: state, clientId: this.clientId };
  }

  getOAuthScopes(){
    return {
      'Gmail': GmailService.scope
    }
  }

  /**
   * Exchange authorization code for tokens and store them
   * If email is not provided, it will be fetched from Google userinfo
   */
  async handleCallback(
    code: string,
    clientId: string,
  ): Promise<{ success: boolean }> {
    if (clientId !== this.clientId) {
      throw new Error('Invalid client id'); 
    }
    try {

      // Exchange code for tokens
      const { tokens } = await this.oauth2Client.getToken(code);

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

      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to handle OAuth callback: ${error.message}`,
        error.stack,
      );
      throw error;
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
        `Failed to get authenticated client: ${error.message}`,error
      );
      return null
    }

  }
}
