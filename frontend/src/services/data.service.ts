import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, throwError, of, switchMap, tap } from 'rxjs';
import { Usuario, Colaborador, Setor, Cargo, Ferias } from '../models/user.model';
import { idMapper } from '../utils/id-mapper';

const API_URL = 'http://localhost:3000';

type Tipo = 'Funcionario' | 'Gestor' | 'RH';

// Interfaces para mapeamento com backend
interface BackendUser {
  id: string;
  nome: string;
  email: string;
  senha?: string;
  cpf: string;
  idade: number;
  salario: number;
  tipo: Tipo;
  setorId: number;
  setor: { id: number; nome: string };
  cargoId: number;
  cargo: { id: number; nome: string };
  gestorId?: string | null;
  gestor?: { id: string; nome: string } | null;
  ferias?: BackendFerias[];
}

interface BackendFerias {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  periodo: number;
  motivo: string;
  status: 'Pendente' | 'Aprovado' | 'Reprovado';
  observacaoReprovacao?: string | null;
  user?: BackendUser;
}

@Injectable({ providedIn: 'root' })
export class DataService {
  private http = inject(HttpClient);

  private getCurrentUserFromStorage(): any {
    if (typeof localStorage !== 'undefined') {
      const user = localStorage.getItem('currentUser');
      return user ? JSON.parse(user) : null;
    }
    return null;
  }

  // Helper para converter BackendUser para Colaborador
  private backendUserToColaborador(user: BackendUser): Colaborador {
    return {
      id: idMapper.uuidToNumber(user.id),
      nome: user.nome,
      cpf: user.cpf,
      setorId: user.setorId,
      cargoId: user.cargoId,
      salario: user.salario,
      gestorId: user.gestorId ? idMapper.uuidToNumber(user.gestorId) : null,
      email: user.email || undefined,
      senha: user.senha || undefined,
    };
  }

  // Helper para converter BackendUser para Usuario
  private backendUserToUsuario(user: BackendUser): Usuario {
    return {
      id: idMapper.uuidToNumber(user.id),
      nome: user.nome,
      email: user.email,
      setor: user.setor?.nome || '',
      cargo: user.cargo?.nome || user.tipo,
    };
  }

  // Helper para converter BackendFerias para Ferias
  private backendFeriasToFerias(ferias: BackendFerias): Ferias {
    return {
      id: idMapper.uuidToNumber(ferias.id),
      colaboradorId: idMapper.uuidToNumber(ferias.userId),
      dataInicio: ferias.startDate.split('T')[0], // Extrair apenas a data
      dias: ferias.periodo as 7 | 15,
      observacoes: ferias.motivo,
      status: ferias.status,
      observacaoReprovacao: ferias.observacaoReprovacao || undefined,
    };
  }

  // Users - mantido para compatibilidade, mas agora usa dados de users
  getUsuarios(): Observable<Usuario[]> {
    console.log('📡 Fazendo requisição GET para /users');
    return this.http.get<BackendUser[]>(`${API_URL}/users`).pipe(
      tap(() => console.log('✅ Resposta recebida de /users')),
      map(users => users
        .filter(u => u.tipo === 'Gestor' || u.tipo === 'RH')
        .map(u => this.backendUserToUsuario(u))
      ),
      catchError(error => {
        console.error('❌ Erro ao buscar usuários:', error);
        console.error('Detalhes:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error
        });
        return throwError(() => error);
      })
    );
  }
  
  addUsuario(user: Omit<Usuario, 'id'>): Observable<Usuario> {
    // Buscar setor e cargo por nome
    return this.getSetores().pipe(
      map(setores => {
        const setor = setores.find(s => s.nome === user.setor);
        const cargo = setores.find(c => c.nome === user.cargo);
        // Este método não é mais usado diretamente, mas mantido para compatibilidade
        return { ...user, id: 0 };
      })
    );
  }

  getUserByCredentials(email: string, senha: string): Observable<Usuario[]> {
    // Este método não é mais usado (login usa AuthService)
    return of([]);
  }

  updateUsuario(usuario: Partial<Usuario> & {id: number}): Observable<Usuario> {
    const uuid = idMapper.numberToUuid(usuario.id);
    if (!uuid) {
      return throwError(() => new Error('ID não encontrado no mapeamento'));
    }
    return this.http.patch<BackendUser>(`${API_URL}/users/${uuid}`, {
      nome: usuario.nome,
      email: usuario.email,
      senha: usuario.senha,
    }).pipe(
      map(user => this.backendUserToUsuario(user)),
      catchError(error => {
        console.error('Erro ao atualizar usuário:', error);
        return throwError(() => error);
      })
    );
  }
  
  deleteUsuario(id: number): Observable<void> {
    const uuid = idMapper.numberToUuid(id);
    if (!uuid) {
      return throwError(() => new Error('ID não encontrado no mapeamento'));
    }
    return this.http.delete<void>(`${API_URL}/users/${uuid}`).pipe(
      catchError(error => {
        console.error('Erro ao deletar usuário:', error);
        return throwError(() => error);
      })
    );
  }

  // Collaborators - agora usa users do backend
  getColaboradores(): Observable<Colaborador[]> {
    // Verificar se é gestor ou RH para usar o endpoint correto
    const currentUser = this.getCurrentUserFromStorage();
    const isGestor = currentUser?.cargo === 'Gestor';
    const endpoint = isGestor ? `${API_URL}/users/my-team` : `${API_URL}/users`;
    
    console.log('📡 Fazendo requisição GET para', endpoint, isGestor ? '(gestor)' : '(RH)');
    return this.http.get<BackendUser[]>(endpoint).pipe(
      tap(() => console.log('✅ Resposta recebida de', endpoint)),
      map(users => users.map(u => this.backendUserToColaborador(u))),
      catchError(error => {
        console.error('❌ Erro ao buscar colaboradores:', error);
        console.error('Detalhes:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error
        });
        return throwError(() => error);
      })
    );
  }

  getColaboradorById(id: number): Observable<Colaborador | undefined> {
    const uuid = idMapper.numberToUuid(id);
    if (!uuid) {
      // Se não encontrar no mapeamento, tenta usar o ID diretamente (pode ser que ainda não foi mapeado)
      return this.http.get<BackendUser>(`${API_URL}/users/${id}`).pipe(
        map(user => this.backendUserToColaborador(user)),
        catchError(error => {
          console.error('Erro ao buscar colaborador:', error);
          return throwError(() => error);
        })
      );
    }
    return this.http.get<BackendUser>(`${API_URL}/users/${uuid}`).pipe(
      map(user => this.backendUserToColaborador(user)),
      catchError(error => {
        console.error('Erro ao buscar colaborador:', error);
        return throwError(() => error);
      })
    );
  }

  addColaborador(colaborador: Omit<Colaborador, 'id'>): Observable<Colaborador> {
    // Buscar cargo para determinar tipo
    return this.getCargos().pipe(
      map(cargos => {
        const cargo = cargos.find(c => c.id === colaborador.cargoId);
        const cargoNome = cargo?.nome || '';
        
        // Determinar tipo baseado no nome do cargo
        let tipo: Tipo = 'Funcionario';
        if (cargoNome === 'Gestor') {
          tipo = 'Gestor';
        } else if (cargoNome === 'RH') {
          tipo = 'RH';
        }

        const gestorUuid = colaborador.gestorId ? idMapper.numberToUuid(colaborador.gestorId) : undefined;

        const payload: any = {
          nome: colaborador.nome,
          cpf: colaborador.cpf,
          idade: 25, // Valor padrão, campo obrigatório no backend
          salario: colaborador.salario,
          tipo: tipo,
          setorId: colaborador.setorId,
          cargoId: colaborador.cargoId,
          gestorId: gestorUuid || undefined,
          email: colaborador.email || undefined, // Backend gera email automático se não fornecido
          senha: colaborador.senha || undefined, // Backend gera senha temporária se não fornecido
        };

        return payload;
      }),
      switchMap(payload => 
        this.http.post<BackendUser>(`${API_URL}/users`, payload)
      ),
      map(user => this.backendUserToColaborador(user)),
      catchError(error => {
        console.error('Erro ao adicionar colaborador:', error);
        return throwError(() => error);
      })
    );
  }
  
  updateColaborador(colaborador: Colaborador): Observable<Colaborador> {
    const uuid = idMapper.numberToUuid(colaborador.id);
    if (!uuid) {
      return throwError(() => new Error('ID não encontrado no mapeamento'));
    }
    
    // Buscar cargo para determinar o tipo
    return this.getCargos().pipe(
      map(cargos => {
        const cargo = cargos.find(c => c.id === colaborador.cargoId);
        const cargoNome = cargo?.nome || '';
        
        // Determinar tipo baseado no nome do cargo
        let tipo: Tipo = 'Funcionario';
        if (cargoNome === 'Gestor') {
          tipo = 'Gestor';
        } else if (cargoNome === 'RH') {
          tipo = 'RH';
        }

        const gestorUuid = colaborador.gestorId ? idMapper.numberToUuid(colaborador.gestorId) : null;
        
        const payload: any = {
          nome: colaborador.nome,
          setorId: colaborador.setorId,
          cargoId: colaborador.cargoId,
          salario: colaborador.salario,
          tipo: tipo, // Incluir tipo para atualizar corretamente
          gestorId: gestorUuid || null,
          email: colaborador.email || undefined,
          senha: colaborador.senha || undefined,
        };

        return payload;
      }),
      switchMap(payload => 
        this.http.patch<BackendUser>(`${API_URL}/users/${uuid}`, payload)
      ),
      map(user => this.backendUserToColaborador(user)),
      catchError(error => {
        console.error('Erro ao atualizar colaborador:', error);
        return throwError(() => error);
      })
    );
  }
  
  deleteColaborador(id: number, email?: string): Observable<void> {
    const uuid = idMapper.numberToUuid(id);
    if (!uuid) {
      return throwError(() => new Error('ID não encontrado no mapeamento'));
    }
    return this.http.delete<void>(`${API_URL}/users/${uuid}`).pipe(
      catchError(error => {
        console.error('Erro ao deletar colaborador:', error);
        return throwError(() => error);
      })
    );
  }

  // Sectors
  getSetores(): Observable<Setor[]> {
    console.log('📡 Fazendo requisição GET para /setores');
    return this.http.get<Setor[]>(`${API_URL}/setores`).pipe(
      tap(() => console.log('✅ Resposta recebida de /setores')),
      catchError(error => {
        console.error('❌ Erro ao buscar setores:', error);
        console.error('Detalhes:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error
        });
        return throwError(() => error);
      })
    );
  }
  
  addSetor(setor: Omit<Setor, 'id'>): Observable<Setor> {
    return this.http.post<Setor>(`${API_URL}/setores`, { nome: setor.nome }).pipe(
      catchError(error => {
        console.error('Erro ao adicionar setor:', error);
        return throwError(() => error);
      })
    );
  }

  updateSetor(id: number, setor: Partial<Setor>): Observable<Setor> {
    return this.http.patch<Setor>(`${API_URL}/setores/${id}`, { nome: setor.nome }).pipe(
      catchError(error => {
        console.error('Erro ao atualizar setor:', error);
        return throwError(() => error);
      })
    );
  }

  deleteSetor(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/setores/${id}`).pipe(
      catchError(error => {
        console.error('Erro ao deletar setor:', error);
        return throwError(() => error);
      })
    );
  }

  // Roles
  getCargos(): Observable<Cargo[]> {
    console.log('📡 Fazendo requisição GET para /cargos');
    return this.http.get<Cargo[]>(`${API_URL}/cargos`).pipe(
      tap(() => console.log('✅ Resposta recebida de /cargos')),
      catchError(error => {
        console.error('❌ Erro ao buscar cargos:', error);
        console.error('Detalhes:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error
        });
        return throwError(() => error);
      })
    );
  }
  
  addCargo(cargo: Omit<Cargo, 'id'>): Observable<Cargo> {
    return this.http.post<Cargo>(`${API_URL}/cargos`, { nome: cargo.nome }).pipe(
      catchError(error => {
        console.error('Erro ao adicionar cargo:', error);
        return throwError(() => error);
      })
    );
  }

  updateCargo(id: number, cargo: Partial<Cargo>): Observable<Cargo> {
    return this.http.patch<Cargo>(`${API_URL}/cargos/${id}`, { nome: cargo.nome }).pipe(
      catchError(error => {
        console.error('Erro ao atualizar cargo:', error);
        return throwError(() => error);
      })
    );
  }

  deleteCargo(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/cargos/${id}`).pipe(
      catchError(error => {
        console.error('Erro ao deletar cargo:', error);
        return throwError(() => error);
      })
    );
  }
  
  // Gestores (Managers)
  getGestores(): Observable<Usuario[]> {
    return this.getUsuarios().pipe(
      map(usuarios => usuarios.filter(u => u.cargo === 'Gestor'))
    );
  }
  
  // Vacation
  getFerias(): Observable<Ferias[]> {
    // Verificar se é gestor ou RH para usar o endpoint correto
    const currentUser = this.getCurrentUserFromStorage();
    const isGestor = currentUser?.cargo === 'Gestor';
    const endpoint = isGestor ? `${API_URL}/vacation-requests/my-team` : `${API_URL}/vacation-requests`;
    
    console.log('📡 Fazendo requisição GET para', endpoint, isGestor ? '(gestor)' : '(RH)');
    return this.http.get<BackendFerias[]>(endpoint).pipe(
      map(feriasList => feriasList.map(f => this.backendFeriasToFerias(f))),
      catchError(error => {
        console.error('Erro ao buscar férias:', error);
        return throwError(() => error);
      })
    );
  }

  addFerias(feriasReq: Omit<Ferias, 'id'>): Observable<Ferias> {
    const userId = idMapper.numberToUuid(feriasReq.colaboradorId);
    if (!userId) {
      return throwError(() => new Error('ID do colaborador não encontrado no mapeamento'));
    }
    
    // Garantir que a data está no formato ISO (YYYY-MM-DD)
    const startDate = feriasReq.dataInicio.includes('T') 
      ? feriasReq.dataInicio.split('T')[0] 
      : feriasReq.dataInicio;
    
    // Garantir que periodo é um número, não string
    const periodo = typeof feriasReq.dias === 'string' 
      ? parseInt(feriasReq.dias, 10) 
      : feriasReq.dias;
    
    const payload: any = {
      userId: userId, // Backend espera UUID (string)
      startDate: startDate, // Formato ISO: YYYY-MM-DD
      periodo: periodo, // Número (7 ou 15)
    };

    // Adicionar motivo apenas se não estiver vazio
    if (feriasReq.observacoes && feriasReq.observacoes.trim() !== '') {
      payload.motivo = feriasReq.observacoes.trim();
    }

    console.log('📤 Enviando solicitação de férias:', payload);

    return this.http.post<BackendFerias>(`${API_URL}/vacation-requests`, payload).pipe(
      map(ferias => this.backendFeriasToFerias(ferias)),
      catchError(error => {
        console.error('Erro ao adicionar férias:', error);
        console.error('Detalhes do erro:', error.error);
        return throwError(() => error);
      })
    );
  }

  updateFeriasStatus(id: number, status: 'Aprovado' | 'Reprovado', observacaoReprovacao?: string): Observable<Ferias> {
    const uuid = idMapper.numberToUuid(id);
    if (!uuid) {
      return throwError(() => new Error('ID não encontrado no mapeamento'));
    }
    
    const payload: any = {
      status: status,
    };
    
    // Para reprovação, enviar observacaoReprovacao apenas se não estiver vazia
    // Para aprovação, não enviar o campo
    if (status === 'Reprovado' && observacaoReprovacao && observacaoReprovacao.trim() !== '') {
      payload.observacaoReprovacao = observacaoReprovacao.trim();
    }

    console.log('📤 Atualizando status de férias:', payload);

    return this.http.patch<BackendFerias>(`${API_URL}/vacation-requests/${uuid}/status`, payload).pipe(
      map(ferias => this.backendFeriasToFerias(ferias)),
      catchError(error => {
        console.error('Erro ao atualizar status de férias:', error);
        console.error('Detalhes do erro:', error.error);
        return throwError(() => error);
      })
    );
  }

  // Métodos para Avatar
  getAvatarUrl(userId: string): string {
    return `${API_URL}/avatars/user/${userId}`;
  }

  getMyAvatarUrl(): string {
    return `${API_URL}/avatars/me`;
  }

  uploadAvatar(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${API_URL}/avatars/upload`, formData);
  }

  updateAvatar(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.patch(`${API_URL}/avatars/update`, formData);
  }

  deleteAvatar(): Observable<any> {
    return this.http.delete(`${API_URL}/avatars/delete`);
  }

  checkAvatarExists(): Observable<Blob> {
    return this.http.get(`${API_URL}/avatars/me`, { responseType: 'blob' });
  }
}
