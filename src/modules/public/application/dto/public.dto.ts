
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




export interface TeamMember {
  socialLinks: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
  id: string;
  fullName: string;
  picture: string;
  roleString: string;
  email:string;
}