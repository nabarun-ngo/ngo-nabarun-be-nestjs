import { ApiProperty } from "@nestjs/swagger";
import { IsDefined, IsNotEmpty, IsString } from "class-validator";

export class SignUpDto {
  @ApiProperty({ required: true })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ required: true })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ required: true })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ required: true })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  dialCode: string;


  @ApiProperty({ required: true })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  contactNumber: string;

  @ApiProperty({ required: true })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  hometown: string;

  @ApiProperty({ required: true })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  howDoUKnowAboutUs: string;
}

export class ContactFormDto {
  fullName: string;
  email: string;
  dialCode: string;
  contactNumber: string;
  subject: string;
  message: string;
}

export class DonationFormDto {
  fullName: string;
  email: string;
  dialCode: string;
  contactNumber: string;
  amount: number;
}

export function dtoToRecord<T extends object>(dto: T): Record<string, string> {
  return Object.entries(dto).reduce((acc, [key, value]) => {
    acc[key] = String(value); // force everything to string
    return acc;
  }, {} as Record<string, string>);
}

