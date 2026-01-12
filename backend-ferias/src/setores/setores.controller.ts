import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { SetoresService } from './setores.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

class CreateSetorDto {
  @IsNotEmpty()
  @IsString()
  nome: string;
}

class UpdateSetorDto {
  @IsNotEmpty()
  @IsString()
  nome: string;
}

@ApiTags('setores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('setores')
export class SetoresController {
  constructor(private service: SetoresService) {}

  @Get()
  @Roles('RH', 'Gestor')
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Roles('RH', 'Gestor')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('RH')
  create(@Body() dto: CreateSetorDto) {
    return this.service.create(dto.nome);
  }

  @Patch(':id')
  @Roles('RH')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSetorDto) {
    return this.service.update(id, dto.nome);
  }

  @Delete(':id')
  @Roles('RH')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.service.delete(id);
  }
}
