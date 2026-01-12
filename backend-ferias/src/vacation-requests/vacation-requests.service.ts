import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVacationRequestDto } from './dto/create-vacation-request.dto';
import { Status } from '@prisma/client';

@Injectable()
export class VacationRequestsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateVacationRequestDto, gestorId: string) {
    const colaborador = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!colaborador) {
      throw new NotFoundException('Colaborador não encontrado');
    }

    // garantir que é subordinado do gestor
    if (colaborador.gestorId !== gestorId) {
      throw new BadRequestException('Colaborador não é subordinado deste gestor.');
    }

    // já existe pendente?
    const existing = await this.prisma.ferias.findFirst({
      where: { userId: dto.userId, status: Status.Pendente },
    });
    if (existing) {
      throw new BadRequestException('Funcionário já possui uma solicitação de férias pendente.');
    }

    // validar data mínima (>= hoje + 14 dias)
    const start = new Date(dto.startDate);
    const todayPlus14 = new Date();
    todayPlus14.setDate(todayPlus14.getDate() + 14);
    if (start < todayPlus14) {
      throw new BadRequestException('A data de início deve ser pelo menos 14 dias a partir de hoje.');
    }

    const end = new Date(start);
    end.setDate(end.getDate() + dto.periodo);

    return this.prisma.ferias.create({
      data: {
        userId: dto.userId,
        startDate: start,
        endDate: end,
        periodo: dto.periodo,
        motivo: dto.motivo ?? '',
      },
    });
  }

  findAllForRh() {
    return this.prisma.ferias.findMany({ include: { user: true } });
  }

  findAllForGestor(gestorId: string) {
    return this.prisma.ferias.findMany({
      where: {
        user: {
          gestorId: gestorId
        }
      },
      include: { user: true }
    });
  }

  async updateStatus(id: string, status: Status, observacaoReprovacao?: string) {
    const ferias = await this.prisma.ferias.findUnique({ where: { id } });
    if (!ferias) throw new NotFoundException('Solicitação não encontrada');

    if (status !== Status.Aprovado && status !== Status.Reprovado) {
      throw new BadRequestException('Status inválido');
    }

    return this.prisma.ferias.update({
      where: { id },
      data: {
        status,
        observacaoReprovacao: status === Status.Reprovado ? observacaoReprovacao ?? null : null,
      },
    });
  }
}