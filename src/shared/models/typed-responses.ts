import { ApiProperty } from '@nestjs/swagger';
import { Type } from '@nestjs/common';

/**
 * Creates a concrete SuccessResponse class for a specific type.
 * This is needed because TypeScript doesn't preserve generic type information at runtime,
 * so Swagger can't properly generate schemas for generic types like SuccessResponse<T>.
 * 
 * Usage:
 * ```typescript
 * const UserSuccessResponse = createSuccessResponseType(UserDto);
 * 
 * @ApiOkResponse({ type: UserSuccessResponse })
 * async getUser(): Promise<SuccessResponse<UserDto>> {
 *   return new SuccessResponse(await this.userService.getById(id));
 * }
 * ```
 */
export function createSuccessResponseType<T>(modelClass: Type<T>) {
  class ConcreteSuccessResponse {
    @ApiProperty() info: string;
    @ApiProperty() timestamp: Date;
    @ApiProperty() traceId?: string;
    @ApiProperty() message: string;
    @ApiProperty({ type: () => modelClass, description: 'Response payload data' })
    responsePayload?: T;
  }
  
  // Set a unique name for the class to avoid conflicts
  Object.defineProperty(ConcreteSuccessResponse, 'name', {
    value: `SuccessResponse${modelClass.name}`,
    writable: false,
  });
  
  return ConcreteSuccessResponse as Type<{
    info: string;
    timestamp: Date;
    traceId?: string;
    message: string;
    responsePayload?: T;
  }>;
}

/**
 * Creates a concrete PagedResult class for a specific type.
 * 
 * Usage:
 * ```typescript
 * const UserPagedResult = createPagedResultType(UserDto);
 * 
 * @ApiOkResponse({ type: UserPagedResult })
 * async listUsers(): Promise<PagedResult<UserDto>> {
 *   return await this.userService.list();
 * }
 * ```
 */
export function createPagedResultType<T>(modelClass: Type<T>) {
  class ConcretePagedResult {
    @ApiProperty({ 
      description: 'List of items for the current page', 
      type: () => modelClass,
      isArray: true 
    })
    items: T[];

    @ApiProperty({ description: 'Total number of items across all pages' })
    total: number;

    @ApiProperty({ description: 'Current page index (1-based or 0-based depending on API)' })
    page: number;

    @ApiProperty({ description: 'Page size (number of items per page)' })
    size: number;
  }
  
  // Set a unique name for the class to avoid conflicts
  Object.defineProperty(ConcretePagedResult, 'name', {
    value: `PagedResult${modelClass.name}`,
    writable: false,
  });
  
  return ConcretePagedResult as Type<{
    items: T[];
    total: number;
    page: number;
    size: number;
  }>;
}

/**
 * Creates a concrete SuccessResponse wrapping a PagedResult for a specific type.
 * 
 * Usage:
 * ```typescript
 * const UserPagedSuccessResponse = createPagedSuccessResponseType(UserDto);
 * 
 * @ApiOkResponse({ type: UserPagedSuccessResponse })
 * async listUsers(): Promise<SuccessResponse<PagedResult<UserDto>>> {
 *   return new SuccessResponse(await this.userService.list());
 * }
 * ```
 */
export function createPagedSuccessResponseType<T>(modelClass: Type<T>) {
  const PagedResultType = createPagedResultType(modelClass);
  
  class ConcretePagedSuccessResponse {
    @ApiProperty() info: string;
    @ApiProperty() timestamp: Date;
    @ApiProperty() traceId?: string;
    @ApiProperty() message: string;
    @ApiProperty({ type: () => PagedResultType, description: 'Paginated response payload' })
    responsePayload?: InstanceType<typeof PagedResultType>;
  }
  
  // Set a unique name for the class to avoid conflicts
  Object.defineProperty(ConcretePagedSuccessResponse, 'name', {
    value: `SuccessResponsePagedResult${modelClass.name}`,
    writable: false,
  });
  
  return ConcretePagedSuccessResponse as Type<{
    info: string;
    timestamp: Date;
    traceId?: string;
    message: string;
    responsePayload?: InstanceType<typeof PagedResultType>;
  }>;
}

