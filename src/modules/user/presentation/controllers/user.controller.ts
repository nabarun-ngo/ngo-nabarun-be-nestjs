import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Put,
} from '@nestjs/common';
import { CreateUserDto, UserDto, UserFilterDto, UserRefDataDto, UserRefDataFilterDto, UserUpdateAdminDto, UserUpdateDto } from '../../application/dto/user.dto';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { SuccessResponse } from '../../../../shared/models/response-model';
import { UserService } from '../../application/services/user.service';
import { PagedResult } from 'src/shared/models/paged-result';
import { ApiAutoResponse, ApiAutoPagedResponse, ApiAutoVoidResponse } from 'src/shared/decorators/api-auto-response.decorator';
import { CurrentUser } from 'src/modules/shared/auth/application/decorators/current-user.decorator';
import { type AuthUser } from 'src/modules/shared/auth/domain/models/api-user.model';
import { RequirePermissions } from 'src/modules/shared/auth/application/decorators/require-permissions.decorator';

@ApiBearerAuth('jwt') // Matches the 'jwt' security definition from main.ts
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiAutoResponse(UserDto, { status: 201, description: 'User created successfully', wrapInSuccessResponse: true })
  @RequirePermissions('create:user')
  async create(@Body() dto: CreateUserDto): Promise<SuccessResponse<UserDto>> {
    return new SuccessResponse<UserDto>(
      await this.userService.create(dto),
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get list of users with pagination and filters' })
  @ApiAutoPagedResponse(UserDto, { description: 'Users retrieved successfully', wrapInSuccessResponse: true })
  @ApiQuery({ name: 'pageIndex', required: false, type: Number, description: 'Index of the page to retrieve' })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, description: 'Count of content to load per page' })
  @RequirePermissions('read:users')
  async listUsers(
    @Query('pageIndex') pageIndex?: number,
    @Query('pageSize') pageSize?: number,
    @Query() filter?: UserFilterDto
  ): Promise<SuccessResponse<PagedResult<UserDto>>> {
    const users = await this.userService.list({
      pageIndex,
      pageSize,
      props: filter
    })
    return new SuccessResponse<PagedResult<UserDto>>(users);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @RequirePermissions('read:user')
  @ApiAutoResponse(UserDto, { wrapInSuccessResponse: true, description: 'User retrieved successfully, Authorities : read:user' })
  async getUser(@Param('id') id: string): Promise<SuccessResponse<UserDto>> {
    return new SuccessResponse<UserDto>(
      await this.userService.getById(id)
    );
  }

  @Get('/profile/me')
  @ApiOperation({ summary: 'Get logged in user' })
  @ApiAutoResponse(UserDto, { wrapInSuccessResponse: true, description: 'User retrieved successfully' })
  async getLoggedInUser(@CurrentUser() authUser: AuthUser): Promise<SuccessResponse<UserDto>> {
    return new SuccessResponse<UserDto>(
      await this.userService.getById(authUser.profile_id!)
    );
  }

  @Get('static/referenceData')
  @ApiOperation({ summary: 'Get logged in user' })
  @ApiAutoResponse(UserRefDataDto, { wrapInSuccessResponse: true, description: 'User retrieved successfully' })
  async referenceData(@Query() filter?: UserRefDataFilterDto): Promise<SuccessResponse<UserRefDataDto>> {
    return new SuccessResponse<UserRefDataDto>(
      await this.userService.getReferenceData(filter)
    );
  }

  @Put('profile/me')
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
  @RequirePermissions('update:user')
  @ApiAutoResponse(UserDto, { wrapInSuccessResponse: true, description: 'User updated successfully, Authorities : update:user' })
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
  @RequirePermissions('update:user_role')
  @ApiAutoVoidResponse({ description: 'Role assigned successfully, Authorities : update:user_role' })
  async assignRole(
    @Param('id') id: string,
    @Body() roles: string[],
  ): Promise<SuccessResponse<void>> {
    await this.userService.assignRole(id, roles);
    return new SuccessResponse<void>();
  }


  @Post('role/:roleCode/assign')
  @ApiOperation({ summary: 'Assign Role to user' })
  @RequirePermissions('update:user_role')
  @ApiAutoVoidResponse({ description: 'Role assigned to users successfully, Authorities : update:user_role' })
  async assignRoleToUser(
    @Param('roleCode') roleCode: string,
    @Body() userIds: string[],
  ): Promise<SuccessResponse<void>> {
    await this.userService.assignRoleToUser(roleCode, userIds);
    return new SuccessResponse<void>();
  }




  //   @Get('states')
  //   @ApiOperation({ summary: 'Get states' })
  //   @ApiAutoResponse(KeyValue, { description: 'States retrieved successfully', isArray: true, wrapInSuccessResponse: false })
  //   async getStates(@Query('countryCode') countryCode: string): Promise<KeyValue[]> {
  //       return await this.publicService.getStates(countryCode);
  //   }

  //   @Get('districts')
  //   @ApiOperation({ summary: 'Get districts' })
  //   @ApiAutoResponse(KeyValue, { description: 'Districts retrieved successfully', isArray: true, wrapInSuccessResponse: false })
  //   async getDistricts(@Query('countryCode') countryCode: string, @Query('stateCode') stateCode: string): Promise<KeyValue[]> {
  //       return await this.publicService.getDistricts(countryCode, stateCode);
  //   }

}
