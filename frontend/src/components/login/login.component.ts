import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { LogoComponent } from '../shared/logo.component';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  imports: [CommonModule, ReactiveFormsModule, LogoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private fb: FormBuilder;
  private authService: AuthService;
  private router: Router;

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  loginForm;

  constructor() {
    this.fb = inject(FormBuilder);
    this.authService = inject(AuthService);
    this.router = inject(Router);

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.errorMessage.set('Por favor, preencha todos os campos corretamente.');
      return;
    }
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.value;

    this.authService.login(email!, password!)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (user) => {
          console.log('👤 Usuário retornado do login:', user);
          console.log('📍 Verificando redirecionamento. setor:', user?.setor, 'cargo:', user?.cargo);
          
          if (user) {
            // Verificar pelo CARGO, não pelo setor
            if (user.cargo === 'RH') {
              console.log('➡️ Redirecionando para /rh (cargo: RH)');
              this.router.navigate(['/rh']).then(success => {
                console.log('✅ Navegação para /rh:', success ? 'sucesso' : 'falhou');
              }).catch(err => {
                console.error('❌ Erro ao navegar para /rh:', err);
                this.errorMessage.set('Erro ao redirecionar. Tente novamente.');
              });
            } else if (user.cargo === 'Gestor') {
              console.log('➡️ Redirecionando para /manager (cargo: Gestor)');
              this.router.navigate(['/manager']).then(success => {
                console.log('✅ Navegação para /manager:', success ? 'sucesso' : 'falhou');
              }).catch(err => {
                console.error('❌ Erro ao navegar para /manager:', err);
                this.errorMessage.set('Erro ao redirecionar. Tente novamente.');
              });
            } else {
              console.warn('⚠️ Usuário sem permissão. setor:', user.setor, 'cargo:', user.cargo);
              this.errorMessage.set('Acesso não autorizado. Apenas usuários com cargo RH ou Gestor podem acessar o sistema.');
            }
          } else {
            console.error('❌ Usuário é null');
            this.errorMessage.set('E-mail ou senha inválidos.');
          }
        },
        error: (err) => {
          console.error('❌ Erro no subscribe do login:', err);
          this.errorMessage.set(err.message || 'Ocorreu um erro. Tente novamente.');
        }
      });
  }
}
