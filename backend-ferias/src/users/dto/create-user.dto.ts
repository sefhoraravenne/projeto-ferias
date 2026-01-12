import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
  MinLength,
} from 'class-validator';
import { Tipo } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({example: 'Sefhora Ravenne'})
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({example: 'maria.rh@empresa.com'})
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({example: '11111111111'})
  @IsString()
  @Length(11, 11)
  @Matches(/^[0-9]*$/)
  cpf: string;

  @ApiProperty({example: '38'})
  @IsInt()
  @Min(0)
  idade: number;

  @ApiProperty({example: '5200'})
  @IsNumber()
  @Min(0)
  salario: number;

  @ApiProperty({example: 'Gestor'})
  @IsEnum(Tipo)
  tipo: Tipo;

  @ApiProperty({example: '21'})
  @IsInt()
  setorId: number;

  @ApiProperty({example: '12'})
  @IsInt()
  cargoId: number;

  @ApiProperty({example: '7'})
  @IsOptional()
  gestorId?: string;

  @ApiProperty({example: 'rh123'})
  @IsOptional()
  @IsString()
  @MinLength(6)
  senha?: string;
}