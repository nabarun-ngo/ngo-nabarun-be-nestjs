import {
  IsString,
  IsEmail,
  MinLength,
  IsObject,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
  IsDateString,
  IsArray,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { LoginMethod, UserStatus } from '../../domain/model/user.model';

export class PhoneNumberDto {
  
  @IsString()
  code: string;

  @IsString()
  
  number: string;

  
  @IsOptional()
  fullNumber: string;
}

export class AddressDto {
  
  @IsString()
  @IsNotEmpty()
  addressLine1: string;

  
  @IsOptional()
  @IsString()
  addressLine2?: string;

  
  @IsOptional()
  @IsString()
  addressLine3?: string;

  
  @IsOptional()
  @IsString()
  landmark?: string;

  
  @IsString()
  @IsNotEmpty()
  hometown: string;

  
  @IsString()
  @IsNotEmpty()
  zipCode: string;

  
  @IsString()
  @IsNotEmpty()
  state: string;

  
  @IsString()
  @IsNotEmpty()
  district: string;

  
  @IsString()
  @IsNotEmpty()
  country: string;
}

export class LinkDto {
  
  @IsString()
  @IsNotEmpty()
  platform: string;

  
  @IsString()
  @IsNotEmpty()
  platformName: string;

  
  @IsString()
  @IsNotEmpty()
  url: string;
}

export class RoleDto {
  
  @IsString()
  @IsNotEmpty()
  roleCode: string;

  
  @IsString()
  @IsNotEmpty()
  roleName: string;

  
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  lastName: string;

  @IsEmail()
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsObject()
  @ValidateNested()
  @Type(() => PhoneNumberDto)
  phoneNumber: PhoneNumberDto;

  @IsBoolean()
  isTemporary: boolean;
}

export class UserUpdateDto {
  
  @IsOptional()
  @IsString()
  title?: string;

  
  @IsOptional()
  @IsString()
  firstName?: string;

  
  @IsOptional()
  @IsString()
  middleName?: string;

  
  @IsOptional()
  @IsString()
  lastName?: string;

  
  @IsOptional()
  @IsDateString()
  dateOfBirth?: Date;

  
  @IsOptional()
  @IsString()
  gender?: string;

  
  @IsOptional()
  @IsString()
  about?: string;

  
  @IsOptional()
  @IsString()
  picture?: string;

  
  @IsOptional()
  @ValidateNested()
  @Type(() => PhoneNumberDto)
  primaryNumber?: PhoneNumberDto;

  
  @IsOptional()
  @ValidateNested()
  @Type(() => PhoneNumberDto)
  secondaryNumber?: PhoneNumberDto;

  
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  presentAddress?: AddressDto;

  
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  permanentAddress?: AddressDto;

  
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LinkDto)
  socialMediaLinks?: LinkDto[];

  
  @IsOptional()
  @IsBoolean()
  isAddressSame?: boolean;

  
  @IsOptional()
  @IsBoolean()
  isPublicProfile?: boolean;
}

export class UserUpdateAdminDto {
  
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoleDto)
  roles?: RoleDto[];

  
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  
  @IsOptional()
  @IsBoolean()
  isActiveDonor?: boolean;

  
  @IsOptional()
  @IsString()
  userId?: string;
}

export class UserFilterDto {

  @ApiPropertyOptional()
  @IsOptional() readonly firstName?: string;
  @ApiPropertyOptional() @IsOptional() readonly lastName?: string;
  @ApiPropertyOptional() @IsOptional() readonly email?: string;
  @ApiPropertyOptional() @IsOptional() readonly status?: UserStatus;
  @ApiPropertyOptional() @IsOptional() readonly roleCode?: string;
  @ApiPropertyOptional() @IsOptional() readonly phoneNumber?: string;

}

export class UserDto {
  
  id: string;
  
  title?: string;
  
  fullName: string;
  
  firstName: string;
   middleName?: string;
   lastName: string;
   dateOfBirth?: Date;
   gender?: string;
   about?: string;
   picture?: string;
   roles: RoleDto[];
   email: string;
   primaryNumber?: PhoneNumberDto;
   secondaryNumber?: PhoneNumberDto;
   presentAddress?: AddressDto;
   permanentAddress?: AddressDto;
   socialMediaLinks: LinkDto[];
   createdOn: Date;
   activeDonor: boolean;
   publicProfile: boolean;
   userId?: string;
   status: UserStatus;
   loginMethod: LoginMethod[];
   addressSame?: boolean;
   profileCompleted: boolean;
   blocked: boolean;
}
