import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateUserUseCase } from '../../application/use-cases/create-user.use-case';
import { CreateUserDto, UserDto, UserFilterDto } from '../../application/dto/user.dto';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { SuccessResponse } from '../../../../shared/models/response-model';
import { UseApiKey } from 'src/modules/shared/auth/application/decorators/use-api-key.decorator';
import { UserService } from '../../application/services/user.service';
import { PagedResult } from 'src/shared/models/paged-result';

@ApiSecurity('api-key') // Apply the 'api-key' security definition
@ApiBearerAuth('jwt') // Matches the 'jwt' security definition from main.ts
@Controller('users')
@UseApiKey()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: SuccessResponse<UserDto>,
  })
  async create(@Body() dto: CreateUserDto) {
    return new SuccessResponse<UserDto>(
      await this.userService.create(dto),
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get list of users with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    type: PagedResult<UserDto>,
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Index of the page to retrieve' })
  @ApiQuery({ name: 'size', required: false, type: Number, description: 'Count of content to load per page' })
  async listUsers(
    @Query('page') page?: number,
    @Query('size') size?: number,
    @Query() filter?: UserFilterDto
  ): Promise<PagedResult<UserDto>> {
    return this.userService.list({
      pageIndex: page,
      pageSize: size,
      props: filter
    });
  }
  
  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
    type: UserDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUser(@Param('id') id: string): Promise<UserDto> {
    return await this.userService.getById(id);
  }
  
  // @Put(':id/profile')
  // @ApiOperation({ summary: 'Update user profile (self-update)' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'User profile updated successfully',
  //   type: UserResult,
  // })
  // async updateMyDetails(
  //   @Param('id') id: string,
  //   @Body() command: UserSelfUpdateCommand,
  // ): Promise<UserResult> {
  //   return this.userService.updateMyDetails(id, command);
  // }
  //
  // @Put(':id')
  // @ApiOperation({ summary: 'Update user (admin update)' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'User updated successfully',
  //   type: UserResult,
  // })
  // async updateUser(
  //   @Param('id') id: string,
  //   @Body() command: UserUpdateCommand,
  // ): Promise<UserResult> {
  //   return this.userService.updateUser(id, command);
  // }
}
