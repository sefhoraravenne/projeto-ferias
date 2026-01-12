import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AvatarsService {
  private readonly uploadPath = path.join(process.cwd(), 'uploads', 'avatars');

  constructor(private prisma: PrismaService) {
    // Criar diretório de uploads se não existir
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  async findOneByUserId(userId: string) {
    return this.prisma.avatar.findUnique({
      where: { userId },
      include: { user: true },
    });
  }

  async create(userId: string, filename: string) {
    // Verificar se usuário existe
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Se já existe avatar, deletar o arquivo antigo
    const existingAvatar = await this.prisma.avatar.findUnique({
      where: { userId },
    });

    if (existingAvatar) {
      const oldFilePath = path.join(this.uploadPath, existingAvatar.nome);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
      // Atualizar ao invés de criar
      return this.prisma.avatar.update({
        where: { userId },
        data: { nome: filename },
      });
    }

    return this.prisma.avatar.create({
      data: {
        userId,
        nome: filename,
      },
      include: { user: true },
    });
  }

  async update(userId: string, filename: string) {
    const avatar = await this.prisma.avatar.findUnique({
      where: { userId },
    });

    if (!avatar) {
      throw new NotFoundException('Avatar não encontrado');
    }

    // Deletar arquivo antigo
    const oldFilePath = path.join(this.uploadPath, avatar.nome);
    if (fs.existsSync(oldFilePath)) {
      fs.unlinkSync(oldFilePath);
    }

    return this.prisma.avatar.update({
      where: { userId },
      data: { nome: filename },
      include: { user: true },
    });
  }

  async delete(userId: string) {
    const avatar = await this.prisma.avatar.findUnique({
      where: { userId },
    });

    if (!avatar) {
      throw new NotFoundException('Avatar não encontrado');
    }

    // Deletar arquivo
    const filePath = path.join(this.uploadPath, avatar.nome);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return this.prisma.avatar.delete({
      where: { userId },
    });
  }

  getUploadPath(): string {
    return this.uploadPath;
  }
}



