export interface Usuario {
  id: number;
  nome: string;
  email: string;
  senha?: string;
  setor: string;
  cargo: string;
}

export interface Colaborador {
  id: number;
  nome: string;
  cpf: string;
  setorId: number;
  cargoId: number;
  salario: number;
  gestorId?: number | null;
  // For Gestor type
  email?: string;
  senha?: string;
}

export interface Setor {
  id: number;
  nome: string;
}

export interface Cargo {
  id: number;
  nome: string;
}

export interface Ferias {
  id: number;
  colaboradorId: number;
  dataInicio: string;
  dias: 7 | 15;
  observacoes: string;
  status: 'Pendente' | 'Aprovado' | 'Reprovado';
  observacaoReprovacao?: string;
}

// Extended models for display purposes
export interface ColaboradorDisplay extends Colaborador {
    setorNome: string;
    cargoNome: string;
    gestorNome?: string;
    solicitacaoFerias?: Ferias;
    email?: string;
}