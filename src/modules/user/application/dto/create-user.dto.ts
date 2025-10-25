import { IsString, IsEmail, MinLength } from 'class-validator';
import { PhoneNumber } from '../../domain/value-objects/phone-number.vo';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  firstName: string;

  @IsEmail()
  email: string;
  lastName: string;
  phoneNumber: PhoneNumber;
  isTemporary: boolean;
}

export class CreateUserResponseDto {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}