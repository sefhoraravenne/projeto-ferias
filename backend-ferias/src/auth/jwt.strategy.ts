import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    const secret = config.get<string>('JWT_SECRET') || 'default-secret-change-in-production';
    if (!config.get<string>('JWT_SECRET')) {
      console.warn('⚠️  JWT_SECRET não configurado! Usando secret padrão. Configure JWT_SECRET no .env para produção.');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    // payload vem com: sub, email, tipo, cargo, setor
    console.log('🔍 Validando token JWT. Payload recebido:', {
      sub: payload?.sub,
      email: payload?.email,
      tipo: payload?.tipo,
      cargo: payload?.cargo,
      setor: payload?.setor
    });
    
    if (!payload || !payload.sub) {
      console.error('❌ Token inválido: payload não contém sub');
      throw new Error('Token inválido: payload não contém sub');
    }
    
    const user = {
      userId: payload.sub,
      email: payload.email,
      tipo: payload.tipo,
      cargo: payload.cargo || null,
      setor: payload.setor || null,
    };
    
    console.log('✅ Token validado com sucesso para usuário:', user.email);
    return user;
  }
}