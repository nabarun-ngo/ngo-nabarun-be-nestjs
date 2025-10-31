import { Injectable } from '@nestjs/common';
import { ManagementClient } from 'auth0';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class Auth0Service {
  private managementClient: ManagementClient | null = null;

  constructor(private configService: ConfigService) {}

  get client(): ManagementClient {
    if (this.managementClient) {
      return this.managementClient;
    }

    const domain = this.configService.get<string>('AUTH0_MANAGEMENT_DOMAIN');
    const clientId = this.configService.get<string>(
      'AUTH0_MANAGEMENT_CLIENT_ID',
    );
    const clientSecret = this.configService.get<string>(
      'AUTH0_MANAGEMENT_CLIENT_SECRET',
    );
    const audience = this.configService.get<string>(
      'AUTH0_MANAGEMENT_AUDIENCE',
    );

    if (!domain || !clientId || !clientSecret || !audience) {
      throw new Error('Auth0 Management API configuration is incomplete.');
    }

    // The ManagementClient will automatically handle getting and refreshing the access token.
    this.managementClient = new ManagementClient({
      domain,
      clientId,
      clientSecret,
      audience,
      // Specify the scopes you need for your management API operations.
      // For example, 'read:users update:users'.
      // The scopes depend on what actions you want to perform.
      scope: 'read:users update:users',
    });

    return this.managementClient;
  }
}
