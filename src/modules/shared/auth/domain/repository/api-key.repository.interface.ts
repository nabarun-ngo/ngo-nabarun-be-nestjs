import { IRepository } from 'src/shared/interfaces/repository.interface';
import { ApiKey } from '../models/api-key.model';

export interface IApiKeyRepository extends IRepository<ApiKey, string, any> {
  findByKeyId(key: string): Promise<ApiKey | null>;
}

export const API_KEY_REPOSITORY = Symbol('API_KEY_REPOSITORY');