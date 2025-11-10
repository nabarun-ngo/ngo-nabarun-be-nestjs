import { Injectable } from '@nestjs/common';
import { AuthToken } from '../../domain/auth-token.model';
import { ITokenRepository } from '../../domain/token.repository.interface';
import { Prisma } from 'generated/prisma';
import { PrismaPostgresService } from 'src/modules/shared/database/prisma-postgres.service';
import { BaseFilter } from 'src/shared/models/base-filter-props';
import { PagedResult } from 'src/shared/models/paged-result';

@Injectable()
export class TokenRepository implements ITokenRepository {
    constructor(private readonly prisma: PrismaPostgresService) { }
    findPaged(filter?: BaseFilter<any> | undefined): Promise<PagedResult<AuthToken>> {
        throw new Error('Method not implemented.');
    }

    async findByAttribute(attribute: {
        provider: string,
        clientId: string,
        scope: string,
    }

    ): Promise<AuthToken | null> {
        const token = await this.prisma.oAuthToken.findFirst({
            where: {
                provider: attribute.provider,
                clientId: attribute.clientId,
                scope: {
                    contains: attribute.scope,
                }
            }
        });
        return token ? this.toToken(token) : null;
    }
    findAll(filter: any): Promise<AuthToken[]> {
        throw new Error('Method not implemented.');
    }

    async findById(id: string): Promise<AuthToken | null> {
        const token = await this.prisma.oAuthToken.findUnique({
            where: {
                id: id
            }
        });
        return token ? this.toToken(token) : null;
    }

    async create(entity: AuthToken): Promise<AuthToken> {
        const createdToken = await this.prisma.oAuthToken.create({
            data: {
                id: entity.id,
                clientId: entity.clientId,
                provider: entity.provider,
                email: entity.email,
                accessToken: entity.accessToken,
                refreshToken: entity.refreshToken,
                tokenType: entity.tokenType,
                expiresAt: entity.expiresAt,
                scope: entity.scope,
                createdAt: entity.createdAt,
                updatedAt: entity.updatedAt,
            },
        });
        return this.toToken(createdToken);
    }

    async update(id: string, entity: AuthToken): Promise<AuthToken> {
        // Store or update tokens in database
        const updatedToken = await this.prisma.oAuthToken.update({
            where: {
                id: id
            },
            data: {
                accessToken: entity.accessToken,
                expiresAt: entity.expiresAt,
                tokenType: entity.tokenType,
                updatedAt: entity.updatedAt
            }

        });
        return this.toToken(updatedToken);
    }

    delete(id: string): Promise<void> {
        throw new Error('Method not implemented.');
    }

    private toToken(data: {
        id: string;
        provider: string;
        clientId: string;
        email: string;
        accessToken: string;
        refreshToken: string | null;
        tokenType: string | null;
        expiresAt: Date | null;
        scope: string | null;
        createdAt: Date;
        updatedAt: Date;
    }) {
        return new AuthToken(
            data.id,
            data.clientId,
            data.provider,
            data.email,
            data.accessToken,
            data.refreshToken!,
            data.expiresAt!,
            data.tokenType!,
            data.scope!,
            data.createdAt,
            data.updatedAt
        );
    }
}
