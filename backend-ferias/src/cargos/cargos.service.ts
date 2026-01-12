import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CargosService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.cargo.findMany();
  }

  async findOne(id: number) {
    const cargo = await this.prisma.cargo.findUnique({ where: { id } });
    if (!cargo) throw new NotFoundException('Cargo não encontrado');
    return cargo;
  }

  async create(nome: string) {
    // Verificar se já existe cargo com esse nome
    const existing = await this.prisma.cargo.findUnique({ where: { nome } });
    if (existing) {
      throw new ConflictException(`Cargo "${nome}" já existe.`);
    }
    return this.prisma.cargo.create({ data: { nome } });
  }

  async update(id: number, nome: string) {
    const cargo = await this.prisma.cargo.findUnique({ where: { id } });
    if (!cargo) throw new NotFoundException('Cargo não encontrado');

    // Verificar se outro cargo já tem esse nome
    const existing = await this.prisma.cargo.findUnique({ where: { nome } });
    if (existing && existing.id !== id) {
      throw new ConflictException(`Cargo "${nome}" já existe.`);
    }

    return this.prisma.cargo.update({
      where: { id },
      data: { nome },
    });
  }

  async delete(id: number) {
    const cargo = await this.prisma.cargo.findUnique({ 
      where: { id },
      include: { users: true }
    });
    if (!cargo) throw new NotFoundException('Cargo não encontrado');

    // Verificar se há usuários usando esse cargo
    if (cargo.users && cargo.users.length > 0) {
      throw new BadRequestException(`Não é possível deletar o cargo "${cargo.nome}" pois existem ${cargo.users.length} usuário(s) associado(s).`);
    }

    await this.prisma.cargo.delete({ where: { id } });
    return { message: 'Cargo deletado com sucesso' };
  }
}