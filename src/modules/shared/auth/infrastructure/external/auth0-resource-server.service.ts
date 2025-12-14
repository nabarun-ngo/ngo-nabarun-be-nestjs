import { Inject, Injectable, Logger } from '@nestjs/common';
import { ManagementClient } from 'auth0';
import { ConfigService } from '@nestjs/config';
import { Configkey } from 'src/shared/config-keys';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { ThirdPartyException } from 'src/shared/exceptions/third-party-exception';

export type Auth0ResourceServer = Awaited<ReturnType<ManagementClient['resourceServers']['get']>>;

@Injectable()
export class Auth0ResourceServerService {

  private readonly logger = new Logger(Auth0ResourceServerService.name);
  private readonly managementClient: ManagementClient;

  constructor(private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {
    const domain = this.configService.get<string>(Configkey.AUTH0_DOMAIN)!;
    const clientId = this.configService.get<string>(Configkey.AUTH0_MANAGEMENT_CLIENT_ID)!;
    const clientSecret = this.configService.get<string>(Configkey.AUTH0_MANAGEMENT_CLIENT_SECRET)!;
    const audience = `https://${domain}/api/v2/`;

    if (!domain || !clientId || !clientSecret || !audience) {
      throw new Error('Auth0 Management API configuration is incomplete.');
    }

    this.managementClient = new ManagementClient({
      domain: domain,
      clientId: clientId,
      clientSecret: clientSecret,
      audience,
    });
  }



  async getScopes(identifier: string) {
    try {
      // The Node SDK doesn't have a direct `getByAudience` method.
      // We list all and find the one we need.
      const response = await this.managementClient.resourceServers.get(identifier);
      if (!response) {
        throw new Error(
          `Resource server with identifier ${identifier} not found.`,
        );
      }
      return response.scopes as Auth0ResourceServer['scopes'];
    } catch (e) {
      this.logger.error(
        `Failed to get scopes for ${identifier}: ${e.message}`,
        e.stack,
      );
      throw new ThirdPartyException('auth0', e);
    }
  }

}

