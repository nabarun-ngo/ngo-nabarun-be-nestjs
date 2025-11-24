import { applyDecorators, HttpCode, HttpStatus, Type } from '@nestjs/common';
import { ApiResponse, ApiOkResponse, ApiCreatedResponse, getSchemaPath, ApiExtraModels } from '@nestjs/swagger';
import { SuccessResponse, ErrorResponse } from '../models/response-model';
import { PagedResult } from '../models/paged-result';
import { createSuccessResponseType, createPagedResultType, createPagedSuccessResponseType, createVoidSuccessResponseType } from '../models/typed-responses';

/**
 * Options for automatic response decorator
 */
export interface ApiAutoResponseOptions {
  /**
   * HTTP status code (defaults: POST=201, others=200)
   */
  status?: number;
  /**
   * Description for the response
   */
  description?: string;
  /**
   * Whether to wrap in SuccessResponse (default: auto-detect)
   */
  wrapInSuccessResponse?: boolean;
  /**
   * Whether the response is an array
   */
  isArray?: boolean;
}

/**
 * Automatically adds Swagger response decorators based on the return type.
 * Similar to Spring Boot's automatic response model inclusion.
 * 
 * Usage examples:
 * 
 * ```typescript
 * // Simple DTO response
 * @Get(':id')
 * @ApiAutoResponse(UserDto)
 * async getUser(@Param('id') id: string): Promise<UserDto> {
 *   return await this.userService.getById(id);
 * }
 * 
 * // SuccessResponse wrapper (auto-detected)
 * @Post()
 * @ApiAutoResponse(UserDto, { status: 201 })
 * async create(@Body() dto: CreateUserDto): Promise<SuccessResponse<UserDto>> {
 *   return new SuccessResponse(await this.userService.create(dto));
 * }
 * 
 * // Array response
 * @Get()
 * @ApiAutoResponse(UserDto, { isArray: true })
 * async list(): Promise<UserDto[]> {
 *   return await this.userService.findAll();
 * }
 * 
 * // PagedResult
 * @Get()
 * @ApiAutoResponse(UserDto, { isPaged: true })
 * async listPaged(): Promise<PagedResult<UserDto>> {
 *   return await this.userService.findPaged();
 * }
 * ```
 */
export function ApiAutoResponse<T>(
  model: Type<T>,
  options: ApiAutoResponseOptions = {},
): MethodDecorator {
  // Create concrete response types for Swagger to properly inspect
  const ConcreteSuccessResponse = createSuccessResponseType(model);
  
  return applyDecorators(
    ApiExtraModels(model, SuccessResponse, PagedResult, ErrorResponse, ConcreteSuccessResponse),
    ...createResponseDecorators(model, options, ConcreteSuccessResponse),
    ...createCommonErrorResponses(),
  );
}

/**
 * Helper for SuccessResponse<T> pattern
 */
export function ApiAutoSuccessResponse<T>(
  model: Type<T>,
  options: Omit<ApiAutoResponseOptions, 'wrapInSuccessResponse'> = {},
): MethodDecorator {
  return applyDecorators(
    ApiAutoResponse(model, { ...options, wrapInSuccessResponse: true }),
  );
}

/**
 * Helper for primitive types (string, number, boolean) wrapped in SuccessResponse
 */
export function ApiAutoPrimitiveResponse(
  type: 'string' | 'number' | 'boolean',
  options: Omit<ApiAutoResponseOptions, 'wrapInSuccessResponse'> = {},
): MethodDecorator {
  return applyDecorators(
    ApiExtraModels(SuccessResponse, ErrorResponse),
    ...createPrimitiveResponseDecorators(type, options),
    ...createCommonErrorResponses(),
  );
}

/**
 * Helper for SuccessResponse<void> - operations that succeed but return no payload
 * 
 * Usage:
 * ```typescript
 * @Post(':id/delete')
 * @ApiAutoVoidResponse({ description: 'User deleted successfully' })
 * async deleteUser(@Param('id') id: string): Promise<SuccessResponse<void>> {
 *   await this.userService.delete(id);
 *   return new SuccessResponse();
 * }
 * ```
 */
export function ApiAutoVoidResponse(
  options: Omit<ApiAutoResponseOptions, 'wrapInSuccessResponse' | 'isArray'> = {},
): MethodDecorator {
  const ConcreteVoidSuccessResponse = createVoidSuccessResponseType();
  
  const {
    status = HttpStatus.OK,
    description,
  } = options;

  const decorators: MethodDecorator[] = [];

  if (status !== HttpStatus.OK) {
    decorators.push(HttpCode(status));
  }

  decorators.push(
    status === HttpStatus.CREATED
      ? ApiCreatedResponse({
          description: description || 'Operation completed successfully',
          type: ConcreteVoidSuccessResponse,
        })
      : ApiOkResponse({
          description: description || 'Operation completed successfully',
          type: ConcreteVoidSuccessResponse,
        }),
  );

  return applyDecorators(
    ApiExtraModels(SuccessResponse, ErrorResponse, ConcreteVoidSuccessResponse),
    ...decorators,
    ...createCommonErrorResponses(),
  );
}

/**
 * Creates decorators for primitive type responses
 */
function createPrimitiveResponseDecorators(
  type: 'string' | 'number' | 'boolean',
  options: ApiAutoResponseOptions,
): MethodDecorator[] {
  const {
    status = HttpStatus.OK,
    description,
    wrapInSuccessResponse = true,
  } = options;

  const decorators: MethodDecorator[] = [];

  if (status !== HttpStatus.OK) {
    decorators.push(HttpCode(status));
  }

  if (wrapInSuccessResponse) {
    decorators.push(
      status === HttpStatus.CREATED
        ? ApiCreatedResponse({
            description: description || 'Operation successful',
            schema: {
              allOf: [
                { $ref: getSchemaPath(SuccessResponse) },
                {
                  properties: {
                    responsePayload: { type },
                  },
                },
              ],
            },
          })
        : ApiOkResponse({
            description: description || 'Operation successful',
            schema: {
              allOf: [
                { $ref: getSchemaPath(SuccessResponse) },
                {
                  properties: {
                    responsePayload: { type },
                  },
                },
              ],
            },
          }),
    );
  } else {
    decorators.push(
      status === HttpStatus.CREATED
        ? ApiCreatedResponse({
            description: description || 'Operation successful',
            schema: { type },
          })
        : ApiOkResponse({
            description: description || 'Operation successful',
            schema: { type },
          }),
    );
  }

  return decorators;
}

/**
 * Helper for PagedResult<T> pattern
 */
export function ApiAutoPagedResponse<T>(
  model: Type<T>,
  options: ApiAutoResponseOptions = {},
): MethodDecorator {
  // Create concrete response types for Swagger to properly inspect
  const ConcretePagedResult = createPagedResultType(model);
  const ConcretePagedSuccessResponse = createPagedSuccessResponseType(model);
  
  return applyDecorators(
    ApiExtraModels(model, SuccessResponse, PagedResult, ErrorResponse, ConcretePagedResult, ConcretePagedSuccessResponse),
    ...createPagedResponseDecorators(model, options, ConcretePagedResult, ConcretePagedSuccessResponse),
    ...createCommonErrorResponses(),
  );
}

/**
 * Creates appropriate Swagger response decorators based on the model type
 */
function createResponseDecorators(
  model: Type<any>,
  options: ApiAutoResponseOptions,
  concreteResponseType?: Type<any>,
): MethodDecorator[] {
  const {
    status = HttpStatus.OK,
    description,
    wrapInSuccessResponse,
    isArray = false,
  } = options;

  const decorators: MethodDecorator[] = [];

  // Set HTTP status code if not default
  if (status !== HttpStatus.OK) {
    decorators.push(HttpCode(status));
  }

  // Determine if we should wrap in SuccessResponse
  // Default: wrap unless explicitly set to false
  const shouldWrap = wrapInSuccessResponse !== false;

  if (shouldWrap) {
    // Use concrete response type if available, otherwise fall back to inline schema
    if (concreteResponseType) {
      decorators.push(
        status === HttpStatus.CREATED
          ? ApiCreatedResponse({
              description: description || 'Resource created successfully',
              type: concreteResponseType,
            })
          : ApiOkResponse({
              description: description || 'Operation successful',
              type: concreteResponseType,
            }),
      );
    } else {
      // Fallback to inline schema if concrete type not available
      const responsePayloadSchema = isArray
        ? {
            type: 'array' as const,
            items: { $ref: getSchemaPath(model) },
          }
        : { $ref: getSchemaPath(model) };

      decorators.push(
        status === HttpStatus.CREATED
          ? ApiCreatedResponse({
              description: description || 'Resource created successfully',
              schema: {
                type: 'object',
                required: ['info', 'timestamp', 'message'],
                properties: {
                  info: { type: 'string', example: 'Success' },
                  timestamp: { type: 'string', format: 'date-time' },
                  traceId: { type: 'string' },
                  message: { type: 'string' },
                  responsePayload: responsePayloadSchema,
                },
              },
            })
          : ApiOkResponse({
              description: description || 'Operation successful',
              schema: {
                type: 'object',
                required: ['info', 'timestamp', 'message'],
                properties: {
                  info: { type: 'string', example: 'Success' },
                  timestamp: { type: 'string', format: 'date-time' },
                  traceId: { type: 'string' },
                  message: { type: 'string' },
                  responsePayload: responsePayloadSchema,
                },
              },
            }),
      );
    }
  } else {
    // Direct model response (no SuccessResponse wrapper)
    decorators.push(
      status === HttpStatus.CREATED
        ? ApiCreatedResponse({
            description: description || 'Resource created successfully',
            type: isArray ? [model] : model,
          })
        : ApiOkResponse({
            description: description || 'Operation successful',
            type: isArray ? [model] : model,
          }),
    );
  }

  return decorators;
}

/**
 * Creates decorators for PagedResult<T> responses
 */
function createPagedResponseDecorators(
  model: Type<any>,
  options: ApiAutoResponseOptions,
  concretePagedResult?: Type<any>,
  concretePagedSuccessResponse?: Type<any>,
): MethodDecorator[] {
  const {
    status = HttpStatus.OK,
    description,
    wrapInSuccessResponse = true,
  } = options;

  const decorators: MethodDecorator[] = [];

  if (status !== HttpStatus.OK) {
    decorators.push(HttpCode(status));
  }

  if (wrapInSuccessResponse) {
    // Use concrete response type if available, otherwise fall back to inline schema
    if (concretePagedSuccessResponse) {
      decorators.push(
        ApiOkResponse({
          description: description || 'Paginated results retrieved successfully',
          type: concretePagedSuccessResponse,
        }),
      );
    } else {
      // Fallback to inline schema
      decorators.push(
        ApiOkResponse({
          description: description || 'Paginated results retrieved successfully',
          schema: {
            type: 'object',
            required: ['info', 'timestamp', 'message', 'responsePayload'],
            properties: {
              info: { type: 'string', example: 'Success' },
              timestamp: { type: 'string', format: 'date-time' },
              traceId: { type: 'string' },
              message: { type: 'string' },
              responsePayload: {
                type: 'object',
                required: ['items', 'total', 'page', 'size'],
                properties: {
                  items: {
                    type: 'array',
                    items: { $ref: getSchemaPath(model) },
                  },
                  total: { type: 'number' },
                  page: { type: 'number' },
                  size: { type: 'number' },
                },
              },
            },
          },
        }),
      );
    }
  } else {
    // Use concrete PagedResult type if available, otherwise fall back to inline schema
    if (concretePagedResult) {
      decorators.push(
        ApiOkResponse({
          description: description || 'Paginated results retrieved successfully',
          type: concretePagedResult,
        }),
      );
    } else {
      // Fallback to inline schema
      decorators.push(
        ApiOkResponse({
          description: description || 'Paginated results retrieved successfully',
          schema: {
            type: 'object',
            required: ['items', 'total', 'page', 'size'],
            properties: {
              items: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
              total: { type: 'number' },
              page: { type: 'number' },
              size: { type: 'number' },
            },
          },
        }),
      );
    }
  }

  return decorators;
}

/**
 * Creates common error response decorators (400 and 500) for Swagger documentation
 */
function createCommonErrorResponses(): MethodDecorator[] {
  return [
    // 400 Bad Request - Business exceptions, validation errors
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Bad Request - Business logic error or validation failure',
      type: ErrorResponse,
    }),
    // 500 Internal Server Error - Server errors
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Internal Server Error - An unexpected error occurred',
      type: ErrorResponse,
    }),
  ];
}

