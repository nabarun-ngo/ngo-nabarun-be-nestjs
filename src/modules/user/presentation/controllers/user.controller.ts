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
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { SuccessResponse } from '../../../../shared/models/response-model';
import { UserService } from '../../application/services/user.service';
import { PagedResult } from 'src/shared/models/paged-result';
import { ApiAutoResponse, ApiAutoPagedResponse, ApiAutoPrimitiveResponse, ApiAutoVoidResponse } from 'src/shared/decorators/api-auto-response.decorator';
import { CurrentUser } from 'src/modules/shared/auth/application/decorators/current-user.decorator';
import { type AuthUser } from 'src/modules/shared/auth/domain/models/api-user.model';
import { auth } from 'firebase-admin';

@ApiBearerAuth('jwt') // Matches the 'jwt' security definition from main.ts
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiAutoResponse(UserDto, { status: 201, description: 'User created successfully', wrapInSuccessResponse: true })
  async create(@Body() dto: CreateUserDto): Promise<SuccessResponse<UserDto>> {
    return new SuccessResponse<UserDto>(
      await this.userService.create(dto),
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get list of users with pagination and filters' })
  @ApiAutoPagedResponse(UserDto, { description: 'Users retrieved successfully', wrapInSuccessResponse: true })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Index of the page to retrieve' })
  @ApiQuery({ name: 'size', required: false, type: Number, description: 'Count of content to load per page' })
  async listUsers(
    @Query('page') page?: number,
    @Query('size') size?: number,
    @Query() filter?: UserFilterDto
  ): Promise<SuccessResponse<PagedResult<UserDto>>> {
    const users = await this.userService.list({
      pageIndex: page,
      pageSize: size,
      props: filter
    })
    return new SuccessResponse<PagedResult<UserDto>>(users);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully', type: SuccessResponse<UserDto> })
  @ApiAutoResponse(UserDto, { wrapInSuccessResponse: true, description: 'User retrieved successfully' })
  async getUser(@Param('id') id: string): Promise<SuccessResponse<UserDto>> {
    return new SuccessResponse<UserDto>(
      await this.userService.getById(id)
    );
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get logged in user' })
  @ApiAutoResponse(UserDto, { wrapInSuccessResponse: true, description: 'User retrieved successfully' })
  async getLoggedInUser(@CurrentUser() authUser: AuthUser): Promise<SuccessResponse<UserDto>> {
    return new SuccessResponse<UserDto>(
      await this.userService.getById(authUser.profile_id!)
    );
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update user profile (self-update)' })
  @ApiAutoResponse(UserDto, { wrapInSuccessResponse: true, description: 'User profile updated successfully' })
  async updateMyDetails(
    @CurrentUser() authUser: AuthUser,
    @Body() command: UserUpdateDto,
  ): Promise<SuccessResponse<UserDto>> {
    return new SuccessResponse<UserDto>(
      await this.userService.updateProfile(authUser.profile_id!, command)
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user (admin update)' })
  @ApiAutoResponse(UserDto, { wrapInSuccessResponse: true, description: 'User updated successfully' })
  async updateUser(
    @Param('id') id: string,
    @Body() command: UserUpdateAdminDto,
  ): Promise<SuccessResponse<UserDto>> {
    return new SuccessResponse<UserDto>(
      await this.userService.updateUser(id, command)
    );
  }


  @Post(':id/assign-role')
  @ApiOperation({ summary: 'Assign Role to user' })
  @ApiAutoVoidResponse({ description: 'Role assigned successfully' })
  async assignRole(
    @Param('id') id: string,
    @Body() roles: string[],
  ): Promise<SuccessResponse<void>> {
    await this.userService.assignRole(id, roles);
    return new SuccessResponse<void>();
  }


  @Post('role/:roleCode/assign')
  @ApiOperation({ summary: 'Assign Role to user' })
  @ApiAutoVoidResponse({ description: 'Role assigned to users successfully' })
  async assignRoleToUser(
    @Param('roleCode') roleCode: string,
    @Body() userIds: string[],
  ): Promise<SuccessResponse<void>> {
    await this.userService.assignRoleToUser(roleCode, userIds);
    return new SuccessResponse<void>();
  }
}
