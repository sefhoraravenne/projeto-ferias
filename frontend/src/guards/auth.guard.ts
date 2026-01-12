
import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const currentUser = authService.currentUser();
  const expectedRole = route.data['role'];

  console.log('🛡️ authGuard: Verificando acesso');
  console.log('📍 Rota esperada:', expectedRole);
  console.log('👤 Usuário atual:', currentUser);
  console.log('🔍 setor:', currentUser?.setor, 'cargo:', currentUser?.cargo);

  if (currentUser) {
    // Verificar pelo CARGO, não pelo setor
    if (expectedRole === 'RH' && currentUser.cargo === 'RH') {
      console.log('✅ Acesso permitido para RH (cargo: RH)');
      return true;
    }
    if (expectedRole === 'Gestor' && currentUser.cargo === 'Gestor') {
      console.log('✅ Acesso permitido para Gestor (cargo: Gestor)');
      return true;
    }
    // Logged in but wrong role, redirect to their default page or login
    console.warn('⚠️ Usuário logado mas sem permissão para esta rota');
    const defaultRoute = currentUser.cargo === 'RH' ? '/rh' : '/manager';
    console.log('➡️ Redirecionando para:', defaultRoute);
    return router.parseUrl(defaultRoute);
  }
  
  // Not logged in, redirect to login
  console.warn('⚠️ Usuário não autenticado, redirecionando para login');
  return router.parseUrl('/login');
};
