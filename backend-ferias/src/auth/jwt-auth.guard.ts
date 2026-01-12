import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    
    console.log('🛡️ JwtAuthGuard: Verificando autenticação');
    console.log('📍 URL:', request.url);
    console.log('🔑 Authorization header:', authHeader ? authHeader.substring(0, 20) + '...' : 'NÃO ENCONTRADO');
    
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err) {
      console.error('❌ Erro na autenticação JWT:', err);
      throw err;
    }
    
    if (!user) {
      console.error('❌ Usuário não autenticado. Info:', info);
      throw new Error('Usuário não autenticado');
    }
    
    console.log('✅ Usuário autenticado:', user.email);
    return user;
  }
}