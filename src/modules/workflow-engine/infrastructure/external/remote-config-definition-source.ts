import { Injectable } from '@nestjs/common';
import { RemoteConfigService } from 'src/modules/shared/firebase/remote-config/remote-config.service';
import { parsefromString } from 'src/shared/utilities/kv-config.util';
import { EngineWorkflowDefinition } from '../../domain/vo/engine-workflow-def.vo';
import { IWorkflowDefinitionSource } from '../../domain/repositories/workflow-definition-source.interface';
import { BusinessException } from 'src/shared/exceptions/business-exception';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class RemoteConfigDefinitionSource implements IWorkflowDefinitionSource {
  constructor(private readonly remoteConfig: RemoteConfigService) { }

  async findByType(
    type: string,
    _version?: number,
  ): Promise<EngineWorkflowDefinition | null> {

    let value: string;
    if (!process.env.LOCAL_WORKFLOW_DATA) {
      const all = await this.remoteConfig.getAllKeyValues();
      const config = all[type];
      if (!config || config.value == null) {
        return null;
      }
      value =
        typeof config.value === 'string' ? config.value : JSON.stringify(config.value);
    } else {
      value = fs.readFileSync(path.join(__dirname, `../../workflows/${type}.json`), 'utf-8');
    }

    try {
      return parsefromString<EngineWorkflowDefinition>(value);
    } catch {
      throw new BusinessException(
        `Invalid workflow definition JSON for type: ${type}`,
      );
    }
  }

  async listTypes(): Promise<string[]> {
    const all = await this.remoteConfig.getAllKeyValues();
    return Object.keys(all);
  }
}
