import { ChangeDetectionStrategy, Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { LogoComponent } from '../shared/logo.component';
import { Colaborador, ColaboradorDisplay, Ferias, Setor, Cargo, Usuario } from '../../models/user.model';
import { combineLatest, map, startWith, of, switchMap } from 'rxjs';

type RhView = 'colaboradores' | 'cargos' | 'setores';

@Component({
  selector: 'app-rh-dashboard',
  templateUrl: './rh-dashboard.component.html',
  imports: [CommonModule, ReactiveFormsModule, LogoComponent, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RhDashboardComponent {
  authService: AuthService;
  dataService: DataService;
  fb: FormBuilder;

  activeView = signal<RhView>('colaboradores');
  
  colaboradores = signal<ColaboradorDisplay[]>([]);
  cargos = signal<Cargo[]>([]);
  setores = signal<Setor[]>([]);
  gestores = signal<Usuario[]>([]);
  
  // Filtro de pesquisa
  searchTerm = signal<string>('');
  
  // Colaboradores filtrados
  filteredColaboradores = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) {
      return this.colaboradores();
    }
    
    return this.colaboradores().filter(col => {
      const nomeMatch = col.nome.toLowerCase().includes(term);
      const setorMatch = col.setorNome.toLowerCase().includes(term);
      const cargoMatch = col.cargoNome.toLowerCase().includes(term);
      
      // Verificar status da solicitação de férias
      let statusMatch = false;
      if (col.solicitacaoFerias) {
        const status = col.solicitacaoFerias.status.toLowerCase();
        statusMatch = status.includes(term) || 
                     (term === 'pendente' && status === 'pendente') ||
                     (term === 'aprovado' && status === 'aprovado') ||
                     (term === 'reprovado' && status === 'reprovado');
      } else if (term === 'sem solicitação' || term === 'sem solicitacao' || term === 'n/a') {
        statusMatch = true;
      }
      
      return nomeMatch || setorMatch || cargoMatch || statusMatch;
    });
  });

  showModal = signal(false);
  showReprovalModal = signal(false);
  selectedFerias = signal<Ferias | null>(null);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  
  // Modals para cargos e setores
  showCargoModal = signal(false);
  showSetorModal = signal(false);
  showDeleteCargoModal = signal(false);
  showDeleteSetorModal = signal(false);
  editingCargo = signal<Cargo | null>(null);
  editingSetor = signal<Setor | null>(null);
  cargoToDelete = signal<Cargo | null>(null);
  setorToDelete = signal<Setor | null>(null);
  
  // Avatar
  avatarUrl = signal<string | null>(null);
  showAvatarModal = signal(false);
  avatarFile: File | null = null;
  isUploadingAvatar = signal(false);

  reprovalForm;
  colaboradorForm;
  cargoForm;
  setorForm;

  // Signals for modal and form state
  modalMode = signal<'add' | 'edit'>('add');
  editingCollaborator = signal<ColaboradorDisplay | null>(null);
  private cargoIdSignal = signal<number | null>(null);
  selectedCargoNome;
  isGestor;
  requiresLogin;
  
  // Signals for delete confirmation
  showDeleteModal = signal(false);
  collaboratorToDelete = signal<ColaboradorDisplay | null>(null);

  constructor() {
    this.authService = inject(AuthService);
    this.dataService = inject(DataService);
    this.fb = inject(FormBuilder);

    this.reprovalForm = this.fb.group({
      observacao: [''], // Opcional - não requerido
    });
    
    this.colaboradorForm = this.fb.group({
      nome: ['', Validators.required],
      cpf: ['', [Validators.required, Validators.maxLength(11), Validators.pattern('^[0-9]*$')]],
      setorId: [null as number | null, Validators.required],
      cargoId: [null as number | null, Validators.required],
      salario: [null as number | null, [Validators.required, Validators.min(0)]],
      gestorId: [null as number | null],
      email: [''],
      senha: [''],
    });
    
    this.cargoForm = this.fb.group({ nome: ['', Validators.required]});
    this.setorForm = this.fb.group({ nome: ['', Validators.required]});
    
    this.colaboradorForm.get('cargoId')?.valueChanges.pipe(startWith(null)).subscribe(val => {
        this.cargoIdSignal.set(val);
    });

    this.selectedCargoNome = computed(() => {
        const cargoId = this.cargoIdSignal();
        if (!cargoId) return null;
        return this.cargos().find(c => c.id === cargoId)?.nome;
    });

    this.isGestor = computed(() => this.selectedCargoNome() === 'Gestor');
    this.requiresLogin = computed(() => ['Gestor', 'RH'].includes(this.selectedCargoNome() ?? ''));

    this.loadInitialData();
    this.loadAvatar();

    effect(() => {
        const gestorIdControl = this.colaboradorForm.get('gestorId');
        const emailControl = this.colaboradorForm.get('email');
        const senhaControl = this.colaboradorForm.get('senha');

        // RH e Gestor NÃO precisam de gestor (mas o campo permanece visível)
        if(this.isGestor() || this.selectedCargoNome() === 'RH') {
            gestorIdControl?.clearValidators();
            // Não limpar o valor, apenas remover a obrigatoriedade
        } else {
            gestorIdControl?.setValidators(Validators.required);
        }
        gestorIdControl?.updateValueAndValidity();
        
        if (this.requiresLogin()) {
            emailControl?.setValidators([Validators.required, Validators.email]);
            if (this.modalMode() === 'add' || this.editingCollaborator()?.cargoNome !== this.selectedCargoNome()) {
                senhaControl?.setValidators([Validators.required, Validators.minLength(6)]);
            } else {
                // In edit mode for an existing login user, password is not required, but if entered, must have min length
                senhaControl?.setValidators([Validators.minLength(6)]);
            }
        } else {
            emailControl?.clearValidators();
            senhaControl?.clearValidators();
        }
        emailControl?.updateValueAndValidity();
        senhaControl?.updateValueAndValidity();
    });
  }

  loadInitialData(): void {
    this.loadColaboradores();
    this.dataService.getCargos().subscribe(data => this.cargos.set(data));
    this.dataService.getSetores().subscribe(data => this.setores.set(data));
    this.dataService.getGestores().subscribe(data => this.gestores.set(data));
  }

  loadColaboradores(): void {
     combineLatest([
        this.dataService.getUsuarios(),
        this.dataService.getColaboradores(),
        this.dataService.getCargos(),
        this.dataService.getSetores(),
        this.dataService.getGestores(),
        this.dataService.getFerias()
    ]).pipe(
        map(([usuarios, colaboradores, cargos, setores, gestores, ferias]) => {
            const displayList: ColaboradorDisplay[] = [];
            const processedUserIds = new Set<number>();

            colaboradores.forEach(col => {
                const setorNome = setores.find(s => s.id === col.setorId)?.nome || 'N/A';
                const cargoNome = cargos.find(c => c.id === col.cargoId)?.nome || 'N/A';
                const gestorNome = gestores.find(g => g.id === col.gestorId)?.nome;
                const solicitacaoFerias = ferias.find(f => f.colaboradorId === col.id && f.status === 'Pendente');
                const userForCol = usuarios.find(u => u.nome === col.nome);

                displayList.push({ 
                    ...col, 
                    setorNome, 
                    cargoNome, 
                    gestorNome, 
                    solicitacaoFerias,
                    email: userForCol?.email
                });
                
                if (userForCol) processedUserIds.add(userForCol.id);
            });

            usuarios.forEach(user => {
                if (!processedUserIds.has(user.id)) {
                    const cargo = cargos.find(c => c.nome === user.cargo);
                    const setor = setores.find(s => s.nome === user.setor);
                    
                    displayList.push({
                        id: user.id,
                        nome: user.nome,
                        cpf: '',
                        setorId: setor?.id || 0,
                        cargoId: cargo?.id || 0,
                        salario: 0,
                        gestorId: null,
                        email: user.email,
                        setorNome: user.setor,
                        cargoNome: user.cargo,
                        gestorNome: 'N/A',
                        solicitacaoFerias: undefined
                    });
                }
            });

            return displayList.sort((a,b) => a.nome.localeCompare(b.nome));
        })
    ).subscribe(data => this.colaboradores.set(data));
  }
  
  loadAvatar(): void {
    const currentUser = this.authService.currentUser();
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
    const currentUser = this.authService.currentUser();
    const hasAvatar = this.avatarUrl() !== null;
    
    const upload$ = hasAvatar 
      ? this.dataService.updateAvatar(this.avatarFile)
      : this.dataService.uploadAvatar(this.avatarFile);
    
    upload$.subscribe({
      next: () => {
        this.isUploadingAvatar.set(false);
        this.showAvatarModal.set(false);
        this.avatarFile = null;
        // Recarregar avatar
        setTimeout(() => this.loadAvatar(), 500);
        this.successMessage.set('Avatar atualizado com sucesso!');
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (err) => {
        this.isUploadingAvatar.set(false);
        console.error('Erro ao fazer upload do avatar:', err);
        this.errorMessage.set(err.error?.message || 'Erro ao fazer upload do avatar.');
        setTimeout(() => this.errorMessage.set(null), 5000);
      }
    });
  }

  formatCpf(cpf: string): string {
    if (!cpf) return '';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  
  handleCpfInput(event: Event): void {
      const input = event.target as HTMLInputElement;
      input.value = input.value.replace(/\D/g, '');
      this.colaboradorForm.get('cpf')?.setValue(input.value);
  }

  openAddCollaboratorModal(): void {
    this.modalMode.set('add');
    this.editingCollaborator.set(null);
    this.errorMessage.set(null);
    this.colaboradorForm.reset({ setorId: null, cargoId: null, gestorId: null });
    this.showModal.set(true);
  }

  openEditCollaboratorModal(col: ColaboradorDisplay): void {
    this.modalMode.set('edit');
    this.editingCollaborator.set(col);
    this.colaboradorForm.patchValue(col);
    this.colaboradorForm.get('senha')?.reset();
    this.showModal.set(true);
  }

  private onSaveSuccess(): void {
    this.loadInitialData();
    this.showModal.set(false);
    this.editingCollaborator.set(null);
  }

  saveColaborador(): void {
    if (this.colaboradorForm.invalid) return;
    
    if (this.modalMode() === 'edit') {
      this.updateColaborador();
    } else {
      this.addNewColaborador();
    }
  }
  
  private addNewColaborador(): void {
    const formValue = this.colaboradorForm.value;
    let newColaborador: Omit<Colaborador, 'id'> = {
        nome: formValue.nome!,
        cpf: formValue.cpf!,
        setorId: formValue.setorId!,
        cargoId: formValue.cargoId!,
        salario: formValue.salario!,
        gestorId: this.isGestor() ? null : formValue.gestorId,
    };

    if (this.requiresLogin()) {
        newColaborador.email = formValue.email!;
        newColaborador.senha = formValue.senha!;
    }
    
    this.dataService.addColaborador(newColaborador).subscribe({
      next: () => {
        console.log('✅ Colaborador adicionado com sucesso');
        this.errorMessage.set(null);
        this.successMessage.set('Colaborador adicionado com sucesso!');
        setTimeout(() => this.successMessage.set(null), 3000);
        this.onSaveSuccess();
      },
      error: (err) => {
        console.error('❌ Erro ao adicionar colaborador:', err);
        let errorMessage = 'Erro ao adicionar colaborador.';
        if (err.error?.message) {
          errorMessage = err.error.message;
        } else if (err.message) {
          errorMessage = err.message;
        }
        this.errorMessage.set(errorMessage);
        // Manter o modal aberto para o usuário corrigir
      }
    });
  }
  
  private updateColaborador(): void {
    const formValue = this.colaboradorForm.value;
    const colToEdit = this.editingCollaborator()!;

    const wasLoginRole = ['Gestor', 'RH'].includes(colToEdit.cargoNome);
    const isNowLoginRole = this.requiresLogin();

    // Case 1: The record being edited IS a User-only record (no CPF)
    if (!colToEdit.cpf) {
        const updatedUser: Partial<Usuario> & { id: number } = {
            id: colToEdit.id,
            nome: formValue.nome!,
            setor: this.setores().find(s => s.id === formValue.setorId!)!.nome,
            cargo: this.cargos().find(c => c.id === formValue.cargoId!)!.nome,
            email: formValue.email!,
        };
        if (formValue.senha) {
            updatedUser.senha = formValue.senha;
        }
        this.dataService.updateUsuario(updatedUser).subscribe({
          next: () => {
            this.successMessage.set('Usuário atualizado com sucesso!');
            setTimeout(() => this.successMessage.set(null), 3000);
            this.onSaveSuccess();
          },
          error: (err) => {
            console.error('❌ Erro ao atualizar usuário:', err);
            this.errorMessage.set(err.error?.message || 'Erro ao atualizar usuário.');
          }
        });
        return;
    }

    // Case 2: The record being edited IS a full Colaborador record (has CPF)
    const updatedColaborador: Colaborador = {
        ...(colToEdit as Colaborador),
        nome: formValue.nome!,
        setorId: formValue.setorId!,
        cargoId: formValue.cargoId!,
        salario: formValue.salario!,
        gestorId: this.isGestor() ? null : formValue.gestorId,
        email: isNowLoginRole ? formValue.email! : undefined,
    };

    // No backend, todos os usuários estão na mesma tabela User
    // Apenas atualizar o colaborador - o backend atualizará o tipo automaticamente
    // Não precisamos mais de lógica complexa de promoção/demotion
    this.dataService.updateColaborador(updatedColaborador).subscribe({
      next: () => {
        console.log('✅ Colaborador atualizado com sucesso');
        this.errorMessage.set(null);
        this.successMessage.set('Colaborador atualizado com sucesso!');
        setTimeout(() => this.successMessage.set(null), 3000);
        this.onSaveSuccess();
      },
      error: (err) => {
        console.error('❌ Erro ao atualizar colaborador:', err);
        let errorMessage = 'Erro ao atualizar colaborador.';
        if (err.error?.message) {
          errorMessage = err.error.message;
        } else if (err.message) {
          errorMessage = err.message;
        }
        this.errorMessage.set(errorMessage);
      }
    });
  }

  // Cargos
  openAddCargoModal(): void {
    this.editingCargo.set(null);
    this.cargoForm.reset();
    this.showCargoModal.set(true);
  }

  openEditCargoModal(cargo: Cargo): void {
    this.editingCargo.set(cargo);
    this.cargoForm.patchValue({ nome: cargo.nome });
    this.showCargoModal.set(true);
  }

  openDeleteCargoModal(cargo: Cargo): void {
    this.cargoToDelete.set(cargo);
    this.showDeleteCargoModal.set(true);
  }

  saveCargo(): void {
    if(this.cargoForm.invalid) return;
    const nome = this.cargoForm.value.nome!;
    const cargo = this.editingCargo();
    
    if (cargo) {
      // Editar (via modal)
      this.dataService.updateCargo(cargo.id, { nome }).subscribe({
        next: () => {
          this.dataService.getCargos().subscribe(data => this.cargos.set(data));
          this.showCargoModal.set(false);
          this.editingCargo.set(null);
          this.cargoForm.reset();
          this.successMessage.set('Cargo atualizado com sucesso!');
          setTimeout(() => this.successMessage.set(null), 3000);
        },
        error: (err) => {
          console.error('Erro ao atualizar cargo:', err);
          this.errorMessage.set(err.error?.message || 'Erro ao atualizar cargo.');
          setTimeout(() => this.errorMessage.set(null), 5000);
        }
      });
    } else {
      // Criar (via formulário do card)
      this.dataService.addCargo({ nome }).subscribe({
        next: () => {
          this.dataService.getCargos().subscribe(data => this.cargos.set(data));
          this.cargoForm.reset();
          this.successMessage.set('Cargo criado com sucesso!');
          setTimeout(() => this.successMessage.set(null), 3000);
        },
        error: (err) => {
          console.error('Erro ao criar cargo:', err);
          this.errorMessage.set(err.error?.message || 'Erro ao criar cargo.');
          setTimeout(() => this.errorMessage.set(null), 5000);
        }
      });
    }
  }

  confirmDeleteCargo(): void {
    const cargo = this.cargoToDelete();
    if (!cargo) return;
    
    this.dataService.deleteCargo(cargo.id).subscribe({
      next: () => {
        this.dataService.getCargos().subscribe(data => this.cargos.set(data));
        this.showDeleteCargoModal.set(false);
        this.cargoToDelete.set(null);
        this.successMessage.set('Cargo deletado com sucesso!');
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (err) => {
        console.error('Erro ao deletar cargo:', err);
        this.errorMessage.set(err.error?.message || 'Erro ao deletar cargo.');
        setTimeout(() => this.errorMessage.set(null), 5000);
      }
    });
  }
  
  // Setores
  openAddSetorModal(): void {
    this.editingSetor.set(null);
    this.setorForm.reset();
    this.showSetorModal.set(true);
  }

  openEditSetorModal(setor: Setor): void {
    this.editingSetor.set(setor);
    this.setorForm.patchValue({ nome: setor.nome });
    this.showSetorModal.set(true);
  }

  openDeleteSetorModal(setor: Setor): void {
    this.setorToDelete.set(setor);
    this.showDeleteSetorModal.set(true);
  }

  saveSetor(): void {
    if(this.setorForm.invalid) return;
    const nome = this.setorForm.value.nome!;
    const setor = this.editingSetor();
    
    if (setor) {
      // Editar (via modal)
      this.dataService.updateSetor(setor.id, { nome }).subscribe({
        next: () => {
          this.dataService.getSetores().subscribe(data => this.setores.set(data));
          this.showSetorModal.set(false);
          this.editingSetor.set(null);
          this.setorForm.reset();
          this.successMessage.set('Setor atualizado com sucesso!');
          setTimeout(() => this.successMessage.set(null), 3000);
        },
        error: (err) => {
          console.error('Erro ao atualizar setor:', err);
          this.errorMessage.set(err.error?.message || 'Erro ao atualizar setor.');
          setTimeout(() => this.errorMessage.set(null), 5000);
        }
      });
    } else {
      // Criar (via formulário do card)
      this.dataService.addSetor({ nome }).subscribe({
        next: () => {
          this.dataService.getSetores().subscribe(data => this.setores.set(data));
          this.setorForm.reset();
          this.successMessage.set('Setor criado com sucesso!');
          setTimeout(() => this.successMessage.set(null), 3000);
        },
        error: (err) => {
          console.error('Erro ao criar setor:', err);
          this.errorMessage.set(err.error?.message || 'Erro ao criar setor.');
          setTimeout(() => this.errorMessage.set(null), 5000);
        }
      });
    }
  }

  confirmDeleteSetor(): void {
    const setor = this.setorToDelete();
    if (!setor) return;
    
    this.dataService.deleteSetor(setor.id).subscribe({
      next: () => {
        this.dataService.getSetores().subscribe(data => this.setores.set(data));
        this.showDeleteSetorModal.set(false);
        this.setorToDelete.set(null);
        this.successMessage.set('Setor deletado com sucesso!');
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (err) => {
        console.error('Erro ao deletar setor:', err);
        this.errorMessage.set(err.error?.message || 'Erro ao deletar setor.');
        setTimeout(() => this.errorMessage.set(null), 5000);
      }
    });
  }
  
  approveFerias(feriasId: number): void {
    this.dataService.updateFeriasStatus(feriasId, 'Aprovado').subscribe({
      next: () => {
        this.loadColaboradores();
        this.successMessage.set('Solicitação de férias aprovada com sucesso!');
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (err) => {
        console.error('Erro ao aprovar férias:', err);
        this.errorMessage.set(err.error?.message || 'Erro ao aprovar solicitação de férias.');
        setTimeout(() => this.errorMessage.set(null), 5000);
      }
    });
  }

  openReprovalModal(ferias: Ferias): void {
    this.selectedFerias.set(ferias);
    this.showReprovalModal.set(true);
  }

  reproveFerias(): void {
    if(this.reprovalForm.invalid || !this.selectedFerias()) {
      console.warn('⚠️ Formulário inválido ou férias não selecionadas');
      return;
    }
    const { observacao } = this.reprovalForm.value;
    console.log('📝 Reprovar férias:', { id: this.selectedFerias()!.id, observacao });
    
    // Enviar observação mesmo se vazia (pode ser opcional no backend)
    const observacaoValue = observacao?.trim() || '';
    
    this.dataService.updateFeriasStatus(this.selectedFerias()!.id, 'Reprovado', observacaoValue).subscribe({
      next: () => {
        console.log('✅ Férias reprovadas com sucesso');
        this.loadColaboradores();
        this.showReprovalModal.set(false);
        this.selectedFerias.set(null);
        this.reprovalForm.reset();
        this.successMessage.set('Solicitação de férias reprovada com sucesso!');
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (err) => {
        console.error('❌ Erro ao reprovar férias:', err);
        console.error('Detalhes do erro:', err.error);
        this.errorMessage.set(err.error?.message || 'Erro ao reprovar solicitação de férias.');
        setTimeout(() => this.errorMessage.set(null), 5000);
      }
    });
  }
  
  openDeleteConfirmation(col: ColaboradorDisplay): void {
    this.collaboratorToDelete.set(col);
    this.showDeleteModal.set(true);
  }

  confirmDelete(): void {
    const col = this.collaboratorToDelete();
    if (!col) return;

    const stream$ = col.cpf 
      ? this.dataService.deleteColaborador(col.id, col.email)
      : this.dataService.deleteUsuario(col.id);

    stream$.subscribe({
      next: () => {
        this.loadColaboradores();
        this.showDeleteModal.set(false);
        this.collaboratorToDelete.set(null);
        this.successMessage.set('Colaborador deletado com sucesso!');
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (err) => {
        console.error('Erro ao deletar colaborador:', err);
        this.errorMessage.set(err.error?.message || 'Erro ao deletar colaborador.');
        setTimeout(() => this.errorMessage.set(null), 5000);
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}