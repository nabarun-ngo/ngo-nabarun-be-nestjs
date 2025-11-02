import { Injectable, Inject } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ExplicitParameterValue } from 'firebase-admin/remote-config';
import { FIREBASE_ADMIN } from '../firebase-core.module';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

export class RemoteConfigParam {
  key: string;
  type: 'STRING' | 'BOOLEAN' | 'NUMBER' | 'JSON'
  value: any;
  group: string;
}

@Injectable()
export class RemoteConfigService {
  constructor(
    @Inject(FIREBASE_ADMIN) private readonly app: admin.app.App,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) { }

  async getAllKeyValues(): Promise<Record<string, RemoteConfigParam>> {
    const cachedItem = await this.cacheManager.get<Record<string, RemoteConfigParam>>('REMOTE_CONFIG_PARAMS');
    if (cachedItem) {
      return cachedItem;
    }

    const remoteConfig = this.app.remoteConfig();
    const template = await remoteConfig.getTemplate();
    const result: Record<string, RemoteConfigParam> = {};

    for (const [key, param] of Object.entries(template.parameters)) {
      result[key] = {
        key: key,
        value: (param.defaultValue as ExplicitParameterValue).value,
        group: 'DEFAULT',
        type: param.valueType ?? 'STRING'
      };
    }

    for (const [groupkey, group] of Object.entries(template.parameterGroups)) {
      for (const [key, param] of Object.entries(group.parameters)) {
        result[key] = {
          key: key,
          value: (param.defaultValue as ExplicitParameterValue).value,
          group: groupkey,
          type: param.valueType ?? 'STRING'
        };
      }
    }
    await this.cacheManager.set('REMOTE_CONFIG_PARAMS', result);
    return result;
  }

  
}