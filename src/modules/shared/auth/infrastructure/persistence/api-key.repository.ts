import { PrismaPostgresService } from "src/modules/shared/database/prisma-postgres.service";
import { IApiKeyRepository } from "../../domain/api-key.repository.interface";
import { Injectable } from "@nestjs/common";
import { ApiKey } from "../../domain/api-key.model";

@Injectable()
export class ApiKeyRepository implements IApiKeyRepository {
    constructor(private readonly prisma: PrismaPostgresService) { }
    async findByKeyId(key: string): Promise<ApiKey | null> {
        const apiKey = await this.prisma.apiKey.findUnique({
            where: { apiKeyId: key }
        })
        return apiKey ? this.toApiKey(apiKey!) : null;
    }

    async findAll(filter: any): Promise<ApiKey[]> {
        const apiKeys = await this.prisma.apiKey.findMany({
            where: {
                expiresAt: {
                    gte: new Date()
                },
            }
        })
        return apiKeys.map(key => this.toApiKey(key));
    }

    async findById(id: string): Promise<ApiKey | null> {
        const apiKey = await this.prisma.apiKey.findUnique({
            where: {
                id: id
            }
        })
        return apiKey ? this.toApiKey(apiKey!) : null;
    }
    async create(entity: ApiKey): Promise<ApiKey> {
        const apiKey = await this.prisma.apiKey.create({
            data: {
                id: entity.id,
                name: entity.name,
                apiKey: entity.key,
                apiKeyId: entity.keyId,
                permissions: entity.permissions.join(","),
                expiresAt: entity.expiresAt,
                lastUsedAt: entity.lastUsedAt,
                createdAt: entity.createdAt,
                updatedAt: entity.updatedAt
            }
        })
        return this.toApiKey(apiKey);
    }

    async update(id: string, entity: ApiKey): Promise<ApiKey> {
        const apiKey = await this.prisma.apiKey.update({
            where: {
                id: id
            },
            data: {
                name: entity.name,
                permissions: entity.permissions.join(","),
                expiresAt: entity.expiresAt,
                lastUsedAt: entity.lastUsedAt,
                updatedAt: entity.updatedAt
            }
        })
        return this.toApiKey(apiKey);
    }
    async delete(id: string): Promise<void> {
        await this.prisma.apiKey.delete({
            where: {
                id: id
            }
        });
    }

    private toApiKey(key: {
        apiKeyId: string; apiKey: string; id: string; name: string; permissions: string; rateLimit: bigint | null; expiresAt: Date | null; lastUsedAt: Date | null; createdAt: Date; updatedAt: Date;
    }): ApiKey {
        return new ApiKey({
            id: key.id,
            name: key.name,
            key: key.apiKey,
            keyId: key.apiKeyId,
            permissions: key.permissions.split(","),
            expiresAt: key.expiresAt!,
            lastUsedAt: key.lastUsedAt!,
            createdAt: key.createdAt,
            updatedAt: key.updatedAt
        })
    }
}