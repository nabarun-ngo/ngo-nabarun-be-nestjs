import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface ApiKeyInfo {
  key: string;
  name: string;
  permissions: string[];
  roles: string[];
  rateLimit?: number;
  expiresAt?: Date;
  createdAt: Date;
  lastUsedAt?: Date;
}

@Injectable()
export class ApiKeyService {
  // In production, store these in database
  private apiKeys = new Map<string, ApiKeyInfo>();

  constructor(private config: ConfigService) {
    // Load API keys from environment or database
    this.initializeApiKeys();
  }

  private initializeApiKeys() {
    // Example: Load from environment
    const masterKey = this.config.get<string>('MASTER_API_KEY');
    if (masterKey) {
      this.apiKeys.set(masterKey, {
        key: masterKey,
        name: 'Master Key',
        permissions: ['*'], // All permissions
        roles: ['admin'],
        createdAt: new Date(),
      });
    }
  }

  async validateApiKey(apiKey: string): Promise<ApiKeyInfo> {
    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    // In production: Query database
    const keyInfo = this.apiKeys.get(apiKey);

    if (!keyInfo) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Check if key is expired
    if (keyInfo.expiresAt && keyInfo.expiresAt < new Date()) {
      throw new UnauthorizedException('API key has expired');
    }

    // Update last used timestamp (in production: async update)
    keyInfo.lastUsedAt = new Date();

    return keyInfo;
  }

  generateApiKey(
    name: string,
    permissions: string[],
    roles: string[] = [],
    expiresInDays?: number,
  ): ApiKeyInfo {
    // Generate secure random key
    const apiKey = this.generateSecureKey();

    const keyInfo: ApiKeyInfo = {
      key: apiKey,
      name,
      permissions,
      roles,
      createdAt: new Date(),
      expiresAt: expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : undefined,
    };

    // In production: Save to database
    this.apiKeys.set(apiKey, keyInfo);

    return keyInfo;
  }

  private generateSecureKey(length: number = 32): string {
    // Generate cryptographically secure random key
    const buffer = crypto.randomBytes(length);
    return `sk_${buffer.toString('base64url')}`; // sk_ prefix for identification
  }

  async revokeApiKey(apiKey: string): Promise<boolean> {
    // In production: Mark as revoked in database
    return this.apiKeys.delete(apiKey);
  }

  async listApiKeys(): Promise<ApiKeyInfo[]> {
    // In production: Query database
    // Never return actual keys, only metadata
    return Array.from(this.apiKeys.values()).map(key => ({
      ...key,
      key: this.maskApiKey(key.key),
    }));
  }

  private maskApiKey(key: string): string {
    // Show only first and last 4 characters
    if (key.length <= 8) return '***';
    return `${key.slice(0, 7)}...${key.slice(-4)}`;
  }
}
