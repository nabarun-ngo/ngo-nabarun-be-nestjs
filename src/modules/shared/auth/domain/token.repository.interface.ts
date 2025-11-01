import { IRepository } from 'src/shared/interfaces/repository.interface';
import { AuthToken } from './auth-token.model';

export interface ITokenRepository extends IRepository<AuthToken, string> {
    findByAttribute(attribute: {
        provider: string,
        clientId: string,
        scope: string,
    }

    ): Promise<AuthToken | null>;
}

export const TOKEN_REPOSITORY = Symbol('TOKEN_REPOSITORY');