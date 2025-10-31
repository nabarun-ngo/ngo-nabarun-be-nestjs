import { Injectable } from '@nestjs/common';
import { AuthenticationClient, ManagementClient } from 'auth0';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class Auth0Service {
  private managementClient: ManagementClient | null = null;
  private readonly domain: string;
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(private configService: ConfigService) {
    this.domain = this.configService.get<string>('AUTH0_MANAGEMENT_DOMAIN')!;
    this.clientId = this.configService.get<string>(
      'AUTH0_MANAGEMENT_CLIENT_ID',
    )!;
    this.clientSecret = this.configService.get<string>(
      'AUTH0_MANAGEMENT_CLIENT_SECRET',
    )!;
  }

  get client(): ManagementClient {
    if (this.managementClient) {
      return this.managementClient;
    }

    const audience = this.configService.get<string>(
      'AUTH0_MANAGEMENT_AUDIENCE',
    );
    if (!this.domain || !this.clientId || !this.clientSecret || !audience) {
      throw new Error('Auth0 Management API configuration is incomplete.');
    }

    // The ManagementClient will automatically handle getting and refreshing the access token.
    this.managementClient = new ManagementClient({
      domain: this.domain,
      clientId: this.clientId,
      clientSecret: this.clientSecret,
      audience,
    });

    return this.managementClient;
  }

  get authClient() {
    return new AuthenticationClient({
      domain: this.domain,
      clientId: this.clientId,
      clientSecret: this.clientSecret,
    });
  }
}
