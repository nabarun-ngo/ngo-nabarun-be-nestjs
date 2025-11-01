import { OnEvent } from "@nestjs/event-emitter";
import { Inject, Injectable } from "@nestjs/common";
import { API_KEY_REPOSITORY } from "../../domain/api-key.repository.interface";
import type { IApiKeyRepository } from "../../domain/api-key.repository.interface";
import { ApiKey } from "../../domain/api-key.model";

@Injectable()
export class ApiKeyEventsHandler {

  constructor(
    @Inject(API_KEY_REPOSITORY) private readonly apiKeyRepository: IApiKeyRepository
  ) { }

  @OnEvent('api-key.updated',{async:true})
  async handleApiKeyUsedEvent(event: ApiKey) {
    await this.apiKeyRepository.update(event.id, event);
  }

}