import { applyDecorators, HttpCode, HttpStatus, Type } from '@nestjs/common';
import { ApiResponse, ApiOkResponse, ApiCreatedResponse, getSchemaPath, ApiExtraModels } from '@nestjs/swagger';
import { SuccessResponse, ErrorResponse } from '../models/response-model';
import { PagedResult } from '../models/paged-result';

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
  return applyDecorators(
    ApiExtraModels(model, SuccessResponse, PagedResult, ErrorResponse),
    ...createResponseDecorators(model, options),
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
  return applyDecorators(
    ApiExtraModels(model, SuccessResponse, PagedResult, ErrorResponse),
    ...createPagedResponseDecorators(model, options),
    ...createCommonErrorResponses(),
  );
}

/**
 * Creates appropriate Swagger response decorators based on the model type
 */
function createResponseDecorators(
  model: Type<any>,
  options: ApiAutoResponseOptions,
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
    // Wrap in SuccessResponse
    decorators.push(
      status === HttpStatus.CREATED
        ? ApiCreatedResponse({
            description: description || 'Resource created successfully',
            schema: {
              allOf: [
                { $ref: getSchemaPath(SuccessResponse) },
                {
                  properties: {
                    responsePayload: isArray
                      ? {
                          type: 'array',
                          items: { $ref: getSchemaPath(model) },
                        }
                      : { $ref: getSchemaPath(model) },
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
                    responsePayload: isArray
                      ? {
                          type: 'array',
                          items: { $ref: getSchemaPath(model) },
                        }
                      : { $ref: getSchemaPath(model) },
                  },
                },
              ],
            },
          }),
    );
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
    // Wrap PagedResult in SuccessResponse
    decorators.push(
      ApiOkResponse({
        description: description || 'Paginated results retrieved successfully',
        schema: {
          allOf: [
            { $ref: getSchemaPath(SuccessResponse) },
            {
              properties: {
                responsePayload: {
                  allOf: [
                    { $ref: getSchemaPath(PagedResult) },
                    {
                      properties: {
                        items: {
                          type: 'array',
                          items: { $ref: getSchemaPath(model) },
                        },
                      },
                    },
                  ],
                },
              },
            },
          ],
        },
      }),
    );
  } else {
    // Direct PagedResult response
    decorators.push(
      ApiOkResponse({
        description: description || 'Paginated results retrieved successfully',
        schema: {
          allOf: [
            { $ref: getSchemaPath(PagedResult) },
            {
              properties: {
                items: {
                  type: 'array',
                  items: { $ref: getSchemaPath(model) },
                },
              },
            },
          ],
        },
      }),
    );
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

