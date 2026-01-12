import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({example: 'maria.rh@empresa.com'})
  @IsEmail()
  email: string;

  @ApiProperty({example: 'rh123'})
  @IsString()
  @IsNotEmpty()
  senha: string;
}