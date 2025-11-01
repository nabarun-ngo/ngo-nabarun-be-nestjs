import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { CreateUserUseCase } from '../../application/use-cases/create-user.use-case';
import { CreateUserDto, UserDto } from '../../application/dto/create-user.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SuccessResponse } from '../../../../shared/models/response-model';
import { Public } from 'src/modules/shared/auth/application/decorators/public.decorator';

@Controller('users')
export class UserController {
  constructor(private readonly createUserUseCase: CreateUserUseCase) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: SuccessResponse<UserDto>,
  })
  async create(@Body() dto: CreateUserDto) {
    return new SuccessResponse<UserDto>(
      await this.createUserUseCase.execute(dto),
    );
  }

  // @Get()
  // @ApiOperation({ summary: 'Get list of users with pagination and filters' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Users retrieved successfully',
  //   type: PagedResult<UserDto>,
  // })
  // async listUsers(
  //   @Query('email') emailLike?: string,
  //   @Query('status') status?: UserStatus,
  //   @Query('roleCode') roleCode?: string,
  //   @Query('page') page?: number,
  //   @Query('size') size?: number,
  //   @Query('sort') sort?: string,
  // ): Promise<PagedResult<UserDto>> {
  //   return this.userService.listUsers(
  //     emailLike,
  //     status,
  //     roleCode,
  //     page,
  //     size,
  //     sort,
  //   );
  // }
  //
  // @Get(':id')
  // @ApiOperation({ summary: 'Get user by ID' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'User retrieved successfully',
  //   type: UserResult,
  // })
  // @ApiResponse({ status: 404, description: 'User not found' })
  // async getUser(@Param('id') id: string): Promise<UserResult> {
  //   const user = await this.userService.getUser(id);
  //   if (!user) {
  //     throw new Error('User not found');
  //   }
  //   return user;
  // }
  //
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
