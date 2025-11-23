import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { ApiKeyService } from '../../application/services/api-key.service';
import { ApiKeyDto, CreateApiKeyDto } from '../dto/api-key.dto';
import { SuccessResponse } from 'src/shared/models/response-model';
import { ApiKey } from '../../domain/models/api-key.model';
import { Public } from '../../application/decorators/public.decorator';


@ApiBearerAuth()
@ApiTags('ApiKey')
@Controller('auth/apikey')
export class ApiKeyController {
  constructor(
    private readonly apiKeyService: ApiKeyService,
  ) { }



  @Post('generate')
  @ApiOperation({
    summary: 'Generate API Key',
  })
  @ApiResponse({
      status: 200,
      description: '',
      type: SuccessResponse<ApiKeyDto>,
    })
  @ApiBody({ type: CreateApiKeyDto  })
  async generateApiKey(
    @Body() create: CreateApiKeyDto,
  ) {
    const result = await this.apiKeyService.generateApiKey(
      create.name,
      create.permissions,
      create.expireAt,
    );
    return new SuccessResponse<ApiKeyDto>(this.toApiKeyDto(result.keyInfo,result.token));
  }

  private toApiKeyDto(apiKey: ApiKey,token?: string): ApiKeyDto {
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

