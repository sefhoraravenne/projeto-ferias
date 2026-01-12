import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // URLs que não precisam de token
  const publicUrls = ['/auth/login'];
  const isPublicUrl = publicUrls.some(url => req.url.includes(url));
  
  if (isPublicUrl) {
    return next(req);
  }

  // Obter token do localStorage
  let token: string | null = null;
  if (typeof window !== 'undefined' && window.localStorage) {
    token = localStorage.getItem('access_token');
  }

  // Debug: log para verificar se o token existe
  if (!token) {
    console.warn('⚠️ Token não encontrado no localStorage para requisição:', req.url);
  } else {
    console.log('✅ Token encontrado, enviando para:', req.url);
  }

  // Adicionar token ao header se existir
  if (token) {
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(clonedReq);
  }

  // Se não tiver token, ainda envia a requisição (o backend vai retornar 401)
  console.warn('⚠️ Requisição sem token será enviada:', req.url);
  return next(req);
};

