import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { VacationRequestsService } from './vacation-requests.service';
import { CreateVacationRequestDto } from './dto/create-vacation-request.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Status } from '@prisma/client';

class UpdateStatusDto {
  @IsEnum(Status)
  status: Status;
  
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacaoReprovacao?: string;
}

@ApiTags('vacation-requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vacation-requests')
export class VacationRequestsController {
  constructor(private service: VacationRequestsService) {}

  // Criado pelo Gestor
  @Post()
  @Roles('Gestor')
  create(@Body() dto: CreateVacationRequestDto, @Req() req: any) {
    console.log('📥 Recebendo solicitação de férias:', dto);
    const gestorId = req.user.userId;
    console.log('👤 Gestor ID:', gestorId);
    return this.service.create(dto, gestorId);
  }

  // RH vê todas
  @Get()
  @Roles('RH')
  findAllForRh() {
    return this.service.findAllForRh();
  }

  // Gestor vê apenas dos seus colaboradores
  @Get('my-team')
  @Roles('Gestor')
  findAllForGestor(@Req() req: any) {
    const gestorId = req.user.userId;
    return this.service.findAllForGestor(gestorId);
  }

  // RH aprova/reprova
  @Patch(':id/status')
  @Roles('RH')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    console.log('📥 Atualizando status de férias:', { id, status: dto.status, observacaoReprovacao: dto.observacaoReprovacao });
    return this.service.updateStatus(id, dto.status, dto.observacaoReprovacao);
  }
}