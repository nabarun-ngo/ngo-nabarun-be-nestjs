import {
  Controller,
  Post,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { ApiKeyService } from '../../application/services/api-key.service';
import { ApiKeyDto, CreateApiKeyDto } from '../../application/dto/api-key.dto';
import { SuccessResponse } from 'src/shared/models/response-model';
import { ApiKey } from '../../domain/models/api-key.model';
import { ApiAutoResponse } from 'src/shared/decorators/api-auto-response.decorator';


@ApiBearerAuth('jwt')
@ApiTags(ApiKeyController.name)
@Controller('auth/apikey')
export class ApiKeyController {
  constructor(
    private readonly apiKeyService: ApiKeyService,
  ) { }



  @Post('generate')
  @ApiOperation({
    summary: 'Generate API Key',
  })
  @ApiAutoResponse(ApiKeyDto, { description: 'API Key generated successfully' })
  @ApiBody({ type: CreateApiKeyDto })
  async generateApiKey(
    @Body() create: CreateApiKeyDto,
  ): Promise<SuccessResponse<ApiKeyDto>> {
    const result = await this.apiKeyService.generateApiKey(
      create.name,
      create.permissions,
      create.expireAt,
    );
    return new SuccessResponse<ApiKeyDto>(this.toApiKeyDto(result.keyInfo, result.token));
  }

  private toApiKeyDto(apiKey: ApiKey, token?: string): ApiKeyDto {
    return {
      id: apiKey.id,
      name: apiKey.name,
      permissions: apiKey.permissions,
      expiresAt: apiKey.expiresAt,
      lastUsedAt: apiKey.lastUsedAt,
      createdAt: apiKey.createdAt,
      updatedAt: apiKey.updatedAt,
      apiToken: token,
    };
  }

}

