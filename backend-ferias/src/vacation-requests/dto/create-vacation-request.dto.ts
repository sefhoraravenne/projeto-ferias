import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateVacationRequestDto {
  @ApiProperty({example: '12334343241'})
  @IsString()
  @IsNotEmpty()
  userId: string; // id do colaborador

  @ApiProperty({example: '2025-11-26'})
  @IsDateString({}, { message: 'startDate deve ser uma data válida no formato ISO (YYYY-MM-DD)' })
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({example: '7 ou 15'})
  @IsNumber()
  @IsIn([7, 15], { message: 'periodo deve ser 7 ou 15' })
  periodo: number;

  @ApiProperty({example: 'Razão da solicitação'})
  @IsOptional()
  @IsString()
  @MaxLength(100)
  motivo?: string;
}