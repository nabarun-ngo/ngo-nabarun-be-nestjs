import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { API_KEY_REPOSITORY } from '../../domain/api-key.repository.interface';
import type { IApiKeyRepository } from '../../domain/api-key.repository.interface';
import { ApiKey } from '../../domain/api-key.model';
import { hashText } from 'src/shared/utilities/crypto.util';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ApiKeyService {
  private apiKeys = new Map<string, ApiKey>();

  constructor(
    private readonly eventEmitter: EventEmitter2,
    @Inject(API_KEY_REPOSITORY) private readonly apiKeyRepository: IApiKeyRepository
  ) {
  }

  async validateApiKey(apiKey: string): Promise<ApiKey> {
    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }
     console.log(apiKey)
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
    this.eventEmitter.emit('api-key.used', keyInfo);

    if (!this.apiKeys.has(keyId)) {
      this.apiKeys.set(keyId, keyInfo);
    }

    return keyInfo;
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
