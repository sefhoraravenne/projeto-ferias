import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Tipo } from '@prisma/client';
import { HashUtil } from '../common/utils/hash.util';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    // regra gestorId - RH e Gestor NÃO precisam de gestor
    const requiresGestor = dto.tipo === Tipo.Funcionario;
    if (requiresGestor && !dto.gestorId) {
      throw new BadRequestException('Funcionário deve ter um gestor definido.');
    }

    // regras de login (Gestor/RH)
    const requiresLogin = dto.tipo === Tipo.Gestor || dto.tipo === Tipo.RH;

    if (requiresLogin) {
      if (!dto.email || !dto.senha) {
        throw new BadRequestException('Gestor e RH devem ter email e senha.');
      }
      if (dto.senha.length < 6) {
        throw new BadRequestException('Senha deve ter pelo menos 6 caracteres.');
      }
    }

    // validação de gestorId (se informado, deve ser Gestor ou RH)
    if (dto.gestorId) {
      const gestor = await this.prisma.user.findUnique({ where: { id: dto.gestorId } });
      if (!gestor || (gestor.tipo !== Tipo.Gestor && gestor.tipo !== Tipo.RH)) {
        throw new BadRequestException('gestorId deve referenciar um Gestor ou RH válido.');
      }
    }

    // validação de email duplicado (quando informado)
    if (dto.email && dto.email.trim() !== '') {
      const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (existing) {
        console.error('❌ Email já cadastrado:', dto.email);
        throw new ConflictException(`Email ${dto.email} já está cadastrado no sistema.`);
      }
    }

    // Validação de CPF duplicado (quando informado)
    if (dto.cpf && dto.cpf.trim() !== '') {
      const existingCpf = await this.prisma.user.findUnique({ where: { cpf: dto.cpf } });
      if (existingCpf) {
        console.error('❌ CPF já cadastrado:', dto.cpf);
        throw new ConflictException(`CPF ${dto.cpf} já está cadastrado no sistema.`);
      }
    }

    // Preparar dados para criação
    const userData: any = {
      nome: dto.nome,
      cpf: dto.cpf,
      idade: dto.idade,
      salario: dto.salario,
      tipo: dto.tipo,
      setorId: dto.setorId,
      cargoId: dto.cargoId,
      gestorId: dto.gestorId ?? null,
    };

    // Email é obrigatório no schema do Prisma, então sempre precisamos de um
    // Para Funcionários sem email, geramos um email único baseado no CPF
    if (dto.email && dto.email.trim() !== '') {
      userData.email = dto.email.trim();
    } else if (requiresLogin) {
      throw new BadRequestException('Email é obrigatório para Gestor e RH.');
    } else {
      // Para Funcionários, gerar email único baseado no CPF
      userData.email = `funcionario.${dto.cpf}@empresa.local`;
      console.log('📧 Gerando email automático para funcionário:', userData.email);
      
      // Verificar se esse email já existe (improvável, mas possível)
      const existingEmail = await this.prisma.user.findUnique({ where: { email: userData.email } });
      if (existingEmail) {
        // Se por algum motivo o email já existe, adicionar timestamp
        userData.email = `funcionario.${dto.cpf}.${Date.now()}@empresa.local`;
      }
    }

    // Senha é obrigatória no schema do Prisma
    if (dto.senha && dto.senha.trim() !== '') {
      // Hash da senha antes de salvar
      userData.senha = await HashUtil.hashPassword(dto.senha);
      console.log('🔑 Senha hasheada com sucesso');
    } else if (requiresLogin) {
      throw new BadRequestException('Senha é obrigatória para Gestor e RH.');
    } else {
      // Para Funcionários, gerar senha temporária hasheada (não será usada para login)
      const tempPassword = `temp_${dto.cpf}_${Date.now()}`;
      userData.senha = await HashUtil.hashPassword(tempPassword);
      console.log('🔑 Gerando senha temporária hasheada para funcionário');
    }

    console.log('📝 Criando usuário com dados:', { ...userData, senha: '***' });

    // criação
    try {
      return await this.prisma.user.create({
        data: userData,
      });
    } catch (error: any) {
      console.error('❌ Erro ao criar usuário:', error);
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0] || 'campo';
        throw new ConflictException(`${field === 'email' ? 'Email' : field === 'cpf' ? 'CPF' : 'Campo'} já está cadastrado no sistema.`);
      }
      throw error;
    }
  }

  findAll() {
    return this.prisma.user.findMany({
      include: { setor: true, cargo: true, gestor: true, ferias: true },
    });
  }

  async findByGestorId(gestorId: string) {
    return this.prisma.user.findMany({
      where: { gestorId },
      include: { setor: true, cargo: true, gestor: true, ferias: true },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { setor: true, cargo: true, gestor: true, ferias: true },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async update(id: string, dto: Partial<CreateUserDto>) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    // Se cargoId foi alterado, determinar o novo tipo baseado no cargo
    let newTipo = dto.tipo || user.tipo;
    if (dto.cargoId && dto.cargoId !== user.cargoId) {
      const cargo = await this.prisma.cargo.findUnique({ where: { id: dto.cargoId } });
      if (cargo) {
        if (cargo.nome === 'Gestor') {
          newTipo = Tipo.Gestor;
        } else if (cargo.nome === 'RH') {
          newTipo = Tipo.RH;
        } else {
          newTipo = Tipo.Funcionario;
        }
        console.log(`🔄 Tipo atualizado baseado no cargo: ${user.tipo} -> ${newTipo} (cargo: ${cargo.nome})`);
      }
    }

    // Validações similares ao create
    // RH e Gestor NÃO precisam de gestor
    const requiresGestor = newTipo === Tipo.Funcionario;
    if (requiresGestor && !dto.gestorId && !user.gestorId) {
      throw new BadRequestException('Funcionário deve ter um gestor definido.');
    }

    const requiresLogin = newTipo === Tipo.Gestor || newTipo === Tipo.RH;
    const wasLoginRole = user.tipo === Tipo.Gestor || user.tipo === Tipo.RH;
    const isBeingDemoted = wasLoginRole && !requiresLogin;

    // Se está sendo rebaixado de Gestor/RH para Funcionário, limpar email e senha por segurança
    let tempEmail: string | undefined;
    let tempPassword: string | undefined;
    if (isBeingDemoted) {
      console.log('⚠️ Rebaixamento detectado: limpando email e senha por segurança');
      // Gerar email e senha temporários (schema exige, mas não serão usados)
      tempEmail = `funcionario.${user.cpf}.${Date.now()}@empresa.local`;
      tempPassword = `temp_${user.cpf}_${Date.now()}`;
    } else if (requiresLogin) {
      if (dto.email && !dto.senha && !user.senha) {
        throw new BadRequestException('Senha é obrigatória para usuários com login.');
      }
    }

    // se estiver alterando email, garantir que não exista outro usuário com o mesmo email
    if (dto.email && dto.email !== user.email && !isBeingDemoted) {
      const other = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (other) throw new ConflictException('Email já cadastrado por outro usuário');
    }

    // Preparar dados para atualização
    const updateData: any = {
      ...(dto.nome && { nome: dto.nome }),
      ...(dto.cpf && { cpf: dto.cpf }),
      ...(dto.idade !== undefined && { idade: dto.idade }),
      ...(dto.salario !== undefined && { salario: dto.salario }),
      tipo: newTipo, // Sempre atualizar o tipo (determinado pelo cargo ou explícito)
      ...(dto.setorId && { setorId: dto.setorId }),
      ...(dto.cargoId && { cargoId: dto.cargoId }),
      ...(dto.gestorId !== undefined && { gestorId: dto.gestorId ?? null }),
    };

    // Email - se rebaixado, usar email temporário, senão usar o fornecido
    if (isBeingDemoted) {
      updateData.email = tempEmail;
    } else if (dto.email !== undefined) {
      updateData.email = dto.email;
    }

    // Senha - se rebaixado, usar senha temporária hasheada, senão hash se fornecida
    if (isBeingDemoted) {
      updateData.senha = await HashUtil.hashPassword(tempPassword!);
      console.log('🔑 Senha temporária gerada e hasheada para rebaixamento');
    } else if (dto.senha && dto.senha.trim() !== '') {
      updateData.senha = await HashUtil.hashPassword(dto.senha);
      console.log('🔑 Senha atualizada e hasheada');
    }

    console.log('📝 Atualizando usuário:', { id, tipo: newTipo, ...updateData, senha: '***' });

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      include: { setor: true, cargo: true, gestor: true, ferias: true },
    });
  }

  async delete(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    
    await this.prisma.user.delete({ where: { id } });
    return { message: 'Usuário deletado com sucesso' };
  }
}