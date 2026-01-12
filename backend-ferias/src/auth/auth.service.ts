import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { HashUtil } from '../common/utils/hash.util';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  async login(dto: LoginDto) {
    console.log('🔐 Tentativa de login para email:', dto.email);
    
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { cargo: true, setor: true }
    });

    if (!user) {
      console.error('❌ Usuário não encontrado com email:', dto.email);
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    // Verificar senha (suporta tanto texto plano quanto hash bcrypt)
    const isPasswordValid = await HashUtil.comparePassword(dto.senha, user.senha);
    if (!isPasswordValid) {
      console.error('❌ Senha incorreta para usuário:', dto.email);
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    // Se a senha está em texto plano (não é hash), migrar para hash
    const isPlainText = !HashUtil.isBcryptHash(user.senha);
    if (isPlainText) {
      console.log('🔄 Migrando senha de texto plano para hash bcrypt...');
      const hashedPassword = await HashUtil.hashPassword(dto.senha);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { senha: hashedPassword }
      });
      console.log('✅ Senha migrada com sucesso para hash bcrypt');
    }

    console.log('✅ Usuário encontrado:', {
      id: user.id,
      nome: user.nome,
      email: user.email,
      tipo: user.tipo
    });

    // Apenas RH ou Gestor podem logar (como no front)
    const isRH = user.tipo === 'RH';
    const isGestor = user.tipo === 'Gestor';

    if (!isRH && !isGestor) {
      console.error('❌ Usuário não tem permissão para login. Tipo:', user.tipo);
      throw new ForbiddenException('Acesso não autorizado.');
    }

    // Buscar cargo e setor
    const cargo = await this.prisma.cargo.findUnique({ where: { id: user.cargoId } });
    const setor = await this.prisma.setor.findUnique({ where: { id: user.setorId } });

    const payload = {
      sub: user.id,
      email: user.email,
      tipo: user.tipo,
      cargo: cargo?.nome || null,
      setor: setor?.nome || null,
    };

    console.log('📦 Payload do token:', payload);

    const token = this.jwtService.sign(payload);
    console.log('🎫 Token gerado:', token.substring(0, 50) + '...');

    // Retornar user com setor e cargo como objetos para compatibilidade com frontend
    return {
      access_token: token,
      user: {
        ...user,
        setor: setor ? { nome: setor.nome } : null,
        cargo: cargo ? { nome: cargo.nome } : null,
      },
    };
  }
}