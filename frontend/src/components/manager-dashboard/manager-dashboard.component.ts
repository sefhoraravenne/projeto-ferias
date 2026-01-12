import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { LogoComponent } from '../shared/logo.component';
import { Colaborador, Usuario, Ferias } from '../../models/user.model';
import { combineLatest, map } from 'rxjs';

interface TeamMemberDisplay {
  id: number;
  nome: string;
  cargo: string;
  setor: string;
  salario: number;
  solicitacaoFerias?: Ferias;
}

@Component({
  selector: 'app-manager-dashboard',
  templateUrl: './manager-dashboard.component.html',
  imports: [CommonModule, LogoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerDashboardComponent {
  authService: AuthService;
  dataService: DataService;
  router: Router;

  currentUser;
  
  teamMembers = signal<TeamMemberDisplay[]>([]);
  
  // Avatar
  avatarUrl = signal<string | null>(null);
  showAvatarModal = signal(false);
  avatarFile: File | null = null;
  isUploadingAvatar = signal(false);

  constructor() {
    this.authService = inject(AuthService);
    this.dataService = inject(DataService);
    this.router = inject(Router);

    this.currentUser = this.authService.currentUser;
    this.loadTeamMembers();
    this.loadAvatar();
  }

  loadTeamMembers(): void {
    const managerId = this.currentUser()?.id;
    if (!managerId) {
      console.warn('⚠️ Manager ID não encontrado:', this.currentUser());
      return;
    }

    console.log('🔍 Carregando equipe para gestor ID:', managerId);

    combineLatest([
        this.dataService.getColaboradores(),
        this.dataService.getCargos(),
        this.dataService.getSetores(),
        this.dataService.getFerias()
    ]).pipe(
      map(([colaboradores, cargos, setores, ferias]) => {
        console.log('📊 Total de colaboradores recebidos:', colaboradores.length);
        console.log('🔍 Colaboradores com gestorId:', colaboradores.filter(c => c.gestorId).map(c => ({ id: c.id, nome: c.nome, gestorId: c.gestorId })));
        
        const filtered = colaboradores.filter(c => {
          // Comparar gestorId com managerId, tratando null/undefined
          const gestorId = c.gestorId ?? null;
          const matches = gestorId !== null && gestorId === managerId;
          if (matches) {
            console.log('✅ Colaborador encontrado:', c.nome, 'gestorId:', gestorId, 'managerId:', managerId);
          } else if (c.gestorId) {
            console.log('❌ Colaborador não corresponde:', c.nome, 'gestorId:', c.gestorId, 'tipo:', typeof c.gestorId, 'managerId:', managerId, 'tipo:', typeof managerId);
          }
          return matches;
        });
        
        console.log('👥 Colaboradores filtrados:', filtered.length);
        
        return filtered.map(colaborador => {
            const cargo = cargos.find(c => c.id === colaborador.cargoId)?.nome || 'N/A';
            const setor = setores.find(s => s.id === colaborador.setorId)?.nome || 'N/A';
            const solicitacaoFerias = ferias
                .filter(f => f.colaboradorId === colaborador.id)
                .sort((a,b) => b.id - a.id)[0];
            return {
              id: colaborador.id,
              nome: colaborador.nome,
              cargo,
              setor,
              salario: colaborador.salario,
              solicitacaoFerias
            };
          });
      })
    ).subscribe({
      next: (team) => {
        console.log('✅ Equipe carregada:', team.length, 'membros');
        this.teamMembers.set(team);
      },
      error: (err) => {
        console.error('❌ Erro ao carregar equipe:', err);
      }
    });
  }

  loadAvatar(): void {
    const currentUser = this.currentUser();
    if (!currentUser?.id) return;
    
    // Tentar carregar avatar, se não existir, avatarUrl ficará null
    this.dataService.checkAvatarExists().subscribe({
      next: (blob) => {
        // Criar URL do blob para exibir a imagem
        const blobUrl = URL.createObjectURL(blob);
        this.avatarUrl.set(blobUrl);
      },
      error: () => {
        // Avatar não existe ou erro ao carregar
        this.avatarUrl.set(null);
      }
    });
  }

  onAvatarFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.avatarFile = input.files[0];
      this.showAvatarModal.set(true);
    }
  }

  getAvatarPreview(): string {
    if (!this.avatarFile) return '';
    return URL.createObjectURL(this.avatarFile);
  }

  uploadAvatar(): void {
    if (!this.avatarFile) return;
    
    this.isUploadingAvatar.set(true);
    const hasAvatar = this.avatarUrl() !== null;
    
    const upload$ = hasAvatar 
      ? this.dataService.updateAvatar(this.avatarFile)
      : this.dataService.uploadAvatar(this.avatarFile);
    
    upload$.subscribe({
      next: () => {
        this.isUploadingAvatar.set(false);
        this.showAvatarModal.set(false);
        this.avatarFile = null;
        setTimeout(() => this.loadAvatar(), 500);
      },
      error: (err) => {
        this.isUploadingAvatar.set(false);
        console.error('Erro ao fazer upload do avatar:', err);
      }
    });
  }

  requestVacation(employeeId: number): void {
    this.router.navigate(['/request-vacation', employeeId]);
  }
  
  logout(): void {
    this.authService.logout();
  }
}