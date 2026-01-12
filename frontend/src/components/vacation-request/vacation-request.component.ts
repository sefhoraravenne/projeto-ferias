import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { ColaboradorDisplay } from '../../models/user.model';
import { combineLatest, map, switchMap } from 'rxjs';

@Component({
  selector: 'app-vacation-request',
  templateUrl: './vacation-request.component.html',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  providers: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VacationRequestComponent {
  private route: ActivatedRoute;
  private router: Router;
  private fb: FormBuilder;
  private dataService: DataService;
  private datePipe: DatePipe;

  employee = signal<ColaboradorDisplay | null>(null);
  isLoading = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  
  minDate: string;
  vacationForm;

  constructor() {
    this.route = inject(ActivatedRoute);
    this.router = inject(Router);
    this.fb = inject(FormBuilder);
    this.dataService = inject(DataService);
    this.datePipe = inject(DatePipe);

    const today = new Date();
    today.setDate(today.getDate() + 14);
    this.minDate = this.datePipe.transform(today, 'yyyy-MM-dd')!;
    
    this.vacationForm = this.fb.group({
      dataInicio: ['', [Validators.required, this.dateValidator.bind(this)]],
      dias: [7, Validators.required],
      observacoes: [''],
    });

    this.route.paramMap.pipe(
      switchMap(params => {
        const id = Number(params.get('id'));
        return combineLatest([
          this.dataService.getColaboradorById(id),
          this.dataService.getCargos(),
          this.dataService.getSetores()
        ]);
      }),
      map(([colaborador, cargos, setores]): ColaboradorDisplay | null => {
        if (!colaborador) {
          return null;
        }
        const cargoNome = cargos.find(c => c.id === colaborador.cargoId)?.nome || 'N/A';
        const setorNome = setores.find(s => s.id === colaborador.setorId)?.nome || 'N/A';
        return { ...colaborador, cargoNome, setorNome };
      })
    ).subscribe(employee => {
      this.employee.set(employee);
    });
  }
  
  dateValidator(control: any): { [key: string]: any } | null {
    const selectedDate = new Date(control.value);
    const minDate = new Date(this.minDate);
    if (selectedDate < minDate) {
      return { 'minDate': { value: control.value } };
    }
    return null;
  }

  onSubmit(): void {
    if (this.vacationForm.invalid || !this.employee()) {
      this.errorMessage.set('Formulário inválido. Verifique os campos.');
      return;
    }

    this.isLoading.set(true);
    const formValue = this.vacationForm.value;
    // Converter dias de string para número
    const dias = typeof formValue.dias === 'string' 
      ? parseInt(formValue.dias, 10) as 7 | 15
      : formValue.dias! as 7 | 15;
    
    const requestData = {
      colaboradorId: this.employee()!.id,
      dataInicio: formValue.dataInicio!,
      dias: dias,
      observacoes: formValue.observacoes!,
      status: 'Pendente' as const
    };

    this.dataService.addFerias(requestData).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.successMessage.set('Solicitação de férias enviada com sucesso!');
        setTimeout(() => this.router.navigate(['/manager']), 2000);
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Erro ao enviar solicitação:', err);
        const errorMsg = err.error?.message || err.message || 'Falha ao enviar a solicitação. Tente novamente.';
        this.errorMessage.set(errorMsg);
      }
    });
  }
}
