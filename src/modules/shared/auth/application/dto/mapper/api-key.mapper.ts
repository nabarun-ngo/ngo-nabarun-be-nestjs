import { ApiKeyDto } from "../api-key.dto";
import { ApiKey } from "../../../domain/models/api-key.model";

export class ApiKeyMapper {
    static toDto(token: ApiKey): ApiKeyDto {
        return {
            id: token.id,
            name: token.name,
            permissions: token.permissions,
            expiresAt: token.expiresAt,
            lastUsedAt: token.lastUsedAt,
            createdAt: token.createdAt,
            updatedAt: token.updatedAt,
        };
    }
}