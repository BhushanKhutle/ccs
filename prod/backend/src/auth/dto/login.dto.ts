import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com or 9876543210', description: 'Email address or mobile number' })
  @IsNotEmpty()
  @IsString()
  email: string;  // accepts email OR mobile number

  @ApiProperty({ example: 'password123' })
  @IsNotEmpty()
  @IsString()
  password: string;
}
