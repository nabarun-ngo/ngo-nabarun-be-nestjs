import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Put,
} from '@nestjs/common';
import { CreateUserDto, UserDto, UserFilterDto, UserUpdateAdminDto, UserUpdateDto } from '../../application/dto/user.dto';
import { ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SuccessResponse } from '../../../../shared/models/response-model';
import { UserService } from '../../application/services/user.service';
import { PagedResult } from 'src/shared/models/paged-result';
import { ApiAutoResponse, ApiAutoPagedResponse } from 'src/shared/decorators/api-auto-response.decorator';

@ApiBearerAuth('jwt') // Matches the 'jwt' security definition from main.ts
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiAutoResponse(UserDto, { status: 201, description: 'User created successfully' })
  async create(@Body() dto: CreateUserDto): Promise<SuccessResponse<UserDto>> {
    return new SuccessResponse<UserDto>(
      await this.userService.create(dto),
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get list of users with pagination and filters' })
  @ApiAutoPagedResponse(UserDto, { description: 'Users retrieved successfully', wrapInSuccessResponse: false })
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
  @ApiAutoResponse(UserDto, { wrapInSuccessResponse: false, description: 'User retrieved successfully' })
  async getUser(@Param('id') id: string): Promise<UserDto> {
    return await this.userService.getById(id);
  }
  
  @Put(':id/profile')
  @ApiOperation({ summary: 'Update user profile (self-update)' })
  @ApiAutoResponse(UserDto, { wrapInSuccessResponse: false, description: 'User profile updated successfully' })
  async updateMyDetails(
    @Param('id') id: string,
    @Body() command: UserUpdateDto,
  ): Promise<UserDto> {
    return await this.userService.updateProfile(id, command);
  }
  
  @Put(':id')
  @ApiOperation({ summary: 'Update user (admin update)' })
  @ApiAutoResponse(UserDto, { wrapInSuccessResponse: false, description: 'User updated successfully' })
  async updateUser(
    @Param('id') id: string,
    @Body() command: UserUpdateAdminDto,
  ): Promise<UserDto> {
    return await this.userService.updateUser(id, command);
  }


  @Post(':id/assign-role')
  @ApiOperation({ summary: 'Assign Role to user' })
  async assignRole(
    @Param('id') id: string,
    @Body() roles: string[],
  ): Promise<void> {
    await this.userService.assignRole(id, roles);
  }
}
