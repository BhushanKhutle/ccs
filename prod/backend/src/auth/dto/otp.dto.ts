import { IsString, Matches, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({ example: '9876543210' })
  @IsString()
  @Matches(/^[6-9]\d{9}$/, { message: 'Valid Indian mobile number required' })
  mobile: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '9876543210' })
  @IsString()
  mobile: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6, { message: 'OTP must be 6 digits' })
  otp: string;
}
