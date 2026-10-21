export type Funcionario = {
  id: string;
  nome: string;
  matricula: string;
  funcao: string;
  pin?: string; // demo local; no Supabase só existe o hash
};

export type Epi = {
  id: string;
  nome: string;
  ca: string;
  validadeCa: string; // AAAA-MM-DD
  lote: string;
  estoque: number;
  estoqueMinimo: number;
};

export type TipoMovimento = "entrega" | "devolucao" | "troca";

export type Entrega = {
  id: string;
  funcionarioId: string;
  epiId: string;
  tipo: TipoMovimento;
  quantidade: number;
  epiNome: string;
  ca: string;
  lote: string;
  assinatura: string; // data URL PNG
  almoxarife: string;
  criadoEm: string; // ISO
  hashAnterior: string | null;
  hash: string;
};
