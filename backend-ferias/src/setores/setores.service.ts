import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SetoresService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.setor.findMany();
  }

  async findOne(id: number) {
    const setor = await this.prisma.setor.findUnique({ where: { id } });
    if (!setor) throw new NotFoundException('Setor não encontrado');
    return setor;
  }

  async create(nome: string) {
    // Verificar se já existe setor com esse nome
    const existing = await this.prisma.setor.findUnique({ where: { nome } });
    if (existing) {
      throw new ConflictException(`Setor "${nome}" já existe.`);
    }
    return this.prisma.setor.create({ data: { nome } });
  }

  async update(id: number, nome: string) {
    const setor = await this.prisma.setor.findUnique({ where: { id } });
    if (!setor) throw new NotFoundException('Setor não encontrado');

    // Verificar se outro setor já tem esse nome
    const existing = await this.prisma.setor.findUnique({ where: { nome } });
    if (existing && existing.id !== id) {
      throw new ConflictException(`Setor "${nome}" já existe.`);
    }

    return this.prisma.setor.update({
      where: { id },
      data: { nome },
    });
  }

  async delete(id: number) {
    const setor = await this.prisma.setor.findUnique({ 
      where: { id },
      include: { users: true }
    });
    if (!setor) throw new NotFoundException('Setor não encontrado');

    // Verificar se há usuários usando esse setor
    if (setor.users && setor.users.length > 0) {
      throw new BadRequestException(`Não é possível deletar o setor "${setor.nome}" pois existem ${setor.users.length} usuário(s) associado(s).`);
    }

    await this.prisma.setor.delete({ where: { id } });
    return { message: 'Setor deletado com sucesso' };
  }
}
