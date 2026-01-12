
import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap, catchError, throwError } from 'rxjs';
import { Usuario } from '../models/user.model';
import { idMapper } from '../utils/id-mapper';

const API_URL = 'http://localhost:3000';

interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    nome: string;
    email: string;
    tipo: string;
    setor: { nome: string };
    cargo: { nome: string };
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  currentUser = signal<Usuario | null>(this.loadUserFromStorage());

  private loadUserFromStorage(): Usuario | null {
    if (typeof localStorage !== 'undefined') {
      const user = localStorage.getItem('currentUser');
      return user ? JSON.parse(user) : null;
    }
    return null;
  }

  private saveUserToStorage(user: Usuario): void {
     if (typeof localStorage !== 'undefined') {
        localStorage.setItem('currentUser', JSON.stringify(user));
     }
  }

  private clearUserFromStorage(): void {
     if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('access_token');
     }
  }

  login(email: string, senha: string): Observable<Usuario | null> {
    console.log('🔐 Tentando fazer login com:', email);
    return this.http.post<LoginResponse>(`${API_URL}/auth/login`, { email, senha }).pipe(
      tap(response => {
        console.log('✅ Login bem-sucedido! Token recebido:', response.access_token?.substring(0, 20) + '...');
        console.log('👤 Usuário:', response.user);
      }),
      map(response => {
        console.log('📦 Resposta completa do backend:', response);
        console.log('🔍 response.user.setor:', response.user.setor);
        console.log('🔍 response.user.cargo:', response.user.cargo);
        
        // Mapear resposta do backend para formato do frontend usando idMapper
        const setorNome = response.user.setor?.nome || (typeof response.user.setor === 'string' ? response.user.setor : '');
        const cargoNome = response.user.cargo?.nome || (typeof response.user.cargo === 'string' ? response.user.cargo : response.user.tipo);
        
        console.log('📝 setorNome extraído:', setorNome);
        console.log('📝 cargoNome extraído:', cargoNome);
        
        const user: Usuario = {
          id: idMapper.uuidToNumber(response.user.id), // Usar mapeamento compartilhado
          nome: response.user.nome,
          email: response.user.email,
          setor: setorNome,
          cargo: cargoNome,
        };

        console.log('👤 Usuário mapeado final:', user);

        // Salvar token
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('access_token', response.access_token);
          console.log('💾 Token salvo no localStorage');
        }

        this.currentUser.set(user);
        this.saveUserToStorage(user);
        return user;
      }),
      catchError(error => {
        console.error('❌ Erro no login:', error);
        console.error('Detalhes do erro:', {
          status: error.status,
          message: error.message,
          error: error.error
        });
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    this.currentUser.set(null);
    this.clearUserFromStorage();
    this.router.navigate(['/login']);
  }
}