import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { API_KEY_REPOSITORY, type IApiKeyRepository } from '../../domain/repository/api-key.repository.interface';
import { ApiKey } from '../../domain/models/api-key.model';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuthUser } from '../../domain/models/api-user.model';

@Injectable()
export class ApiKeyService {
  private apiKeys = new Map<string, ApiKey>();

  constructor(
    private readonly eventEmitter: EventEmitter2,
    @Inject(API_KEY_REPOSITORY) private readonly apiKeyRepository: IApiKeyRepository
  ) {
  }

  async validateApiKey(apiKey: string): Promise<AuthUser> {
    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }
    const keyId = ApiKey.fetchKeyId(apiKey);
    const keyInfo = this.apiKeys.get(keyId) ?? await this.apiKeyRepository.findByKeyId(keyId);

    if (!keyInfo) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Check if key is expired
    if (keyInfo.isExpired()) {
      this.apiKeys.delete(keyId);
      throw new UnauthorizedException('API key has expired');
    }

    // Update last used timestamp (in production: async update)
    keyInfo.used();
    this.eventEmitter.emit('api-key.updated', keyInfo);

    if (!this.apiKeys.has(keyId)) {
      this.apiKeys.set(keyId, keyInfo);
    }

    return {
      sub: `apikey:${keyInfo.id}`,
      name: keyInfo.name,
      permissions: keyInfo.permissions,
      profile_name: keyInfo.name,
      user_id: keyInfo.id,
      type: 'jwt',
    } as AuthUser;
  }

  async generateApiKey(
    name: string,
    permissions: string[],
    expiresAt?: Date,
  ): Promise<{ keyInfo: ApiKey, token: string }> {

    // Generate secure random key
    const { keyInfo, token } = await ApiKey.create({
      name: name,
      permissions: permissions,
      expiresAt: expiresAt,
    });

    this.apiKeys.set(keyInfo.key, keyInfo);
    await this.apiKeyRepository.create(keyInfo);
    return { keyInfo, token };
  }


  async revokeApiKey(id: string): Promise<boolean> {
    const apiKeyInfo = await this.apiKeyRepository.findById(id);
    await this.apiKeyRepository.delete(id)
    return this.apiKeys.delete(apiKeyInfo?.key!);
  }

  async listApiKeys(): Promise<ApiKey[]> {
    return await this.apiKeyRepository.findAll();
  }
}
