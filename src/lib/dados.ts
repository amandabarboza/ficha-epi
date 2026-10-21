"use client";

import { sha256 } from "./hash";
import type { Entrega, Epi, Funcionario, TipoMovimento } from "./tipos";

// Camada de dados da versão de demonstração: tudo fica no navegador.
// O contrato (funções abaixo) é o mesmo que será ligado ao Supabase,
// cujo esquema está em supabase/migrations.

const CHAVE = "ficha-epi:v1";

type Banco = {
  funcionarios: Funcionario[];
  epis: Epi[];
  entregas: Entrega[]; // somente inserção
};

function dataEmDias(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

function semente(): Banco {
  return {
    funcionarios: [
      { id: "f1", nome: "João da Silva", matricula: "1001", funcao: "Soldador", pin: "1234" },
      { id: "f2", nome: "Maria Souza", matricula: "1002", funcao: "Auxiliar de produção", pin: "1234" },
      { id: "f3", nome: "Carlos Pereira", matricula: "1003", funcao: "Eletricista", pin: "1234" },
    ],
    epis: [
      { id: "e1", nome: "Capacete de segurança", ca: "31469", validadeCa: dataEmDias(400), lote: "L-2411", estoque: 12, estoqueMinimo: 5 },
      { id: "e2", nome: "Luva de raspa", ca: "15264", validadeCa: dataEmDias(20), lote: "L-2409", estoque: 3, estoqueMinimo: 6 },
      { id: "e3", nome: "Óculos de proteção", ca: "40277", validadeCa: dataEmDias(-15), lote: "L-2301", estoque: 8, estoqueMinimo: 4 },
      { id: "e4", nome: "Protetor auricular", ca: "5745", validadeCa: dataEmDias(210), lote: "L-2412", estoque: 40, estoqueMinimo: 10 },
    ],
    entregas: [],
  };
}

export function carregar(): Banco {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (bruto) return JSON.parse(bruto) as Banco;
  } catch {
    // armazenamento indisponível: segue com a semente
  }
  const novo = semente();
  salvar(novo);
  return novo;
}

function salvar(banco: Banco) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(banco));
  } catch {
    // modo privado ou sem espaço
  }
}

export function caVencido(epi: Epi): boolean {
  return epi.validadeCa < new Date().toISOString().slice(0, 10);
}

export function diasParaVencer(epi: Epi): number {
  const ms = new Date(epi.validadeCa).getTime() - new Date().setHours(0, 0, 0, 0);
  return Math.ceil(ms / 86_400_000);
}

export type PedidoEntrega = {
  funcionarioId: string;
  epiId: string;
  tipo: TipoMovimento;
  quantidade: number;
  assinatura: string;
  almoxarife: string;
};

export async function registrarEntrega(p: PedidoEntrega): Promise<Entrega> {
  const banco = carregar();
  const epi = banco.epis.find((e) => e.id === p.epiId);
  if (!epi) throw new Error("EPI não encontrado.");
  if (p.tipo !== "devolucao") {
    if (caVencido(epi)) throw new Error(`O CA ${epi.ca} está vencido. Não é possível entregar.`);
    if (epi.estoque < p.quantidade) throw new Error("Estoque insuficiente.");
  }

  const ultimo = banco.entregas.at(-1);
  const id = crypto.randomUUID();
  const criadoEm = new Date().toISOString();
  const hashAnterior = ultimo?.hash ?? null;
  const hash = await sha256(
    [hashAnterior ?? "", id, p.funcionarioId, p.epiId, p.tipo, p.quantidade, epi.ca, epi.lote, p.assinatura, p.almoxarife, criadoEm].join("|"),
  );

  const entrega: Entrega = {
    id,
    funcionarioId: p.funcionarioId,
    epiId: p.epiId,
    tipo: p.tipo,
    quantidade: p.quantidade,
    epiNome: epi.nome,
    ca: epi.ca,
    lote: epi.lote,
    assinatura: p.assinatura,
    almoxarife: p.almoxarife,
    criadoEm,
    hashAnterior,
    hash,
  };

  epi.estoque += p.tipo === "devolucao" ? p.quantidade : -p.quantidade;
  banco.entregas.push(entrega);
  salvar(banco);
  return entrega;
}

export function verificarCadeia(entregas: Entrega[]): Promise<boolean> {
  return (async () => {
    let anterior: string | null = null;
    for (const e of entregas) {
      if (e.hashAnterior !== anterior) return false;
      const esperado = await sha256(
        [anterior ?? "", e.id, e.funcionarioId, e.epiId, e.tipo, e.quantidade, e.ca, e.lote, e.assinatura, e.almoxarife, e.criadoEm].join("|"),
      );
      if (esperado !== e.hash) return false;
      anterior = e.hash;
    }
    return true;
  })();
}

export function cadastrarFuncionario(f: Omit<Funcionario, "id">): Funcionario {
  const banco = carregar();
  if (banco.funcionarios.some((x) => x.matricula === f.matricula)) {
    throw new Error("Já existe um funcionário com essa matrícula.");
  }
  const novo = { ...f, id: crypto.randomUUID() };
  banco.funcionarios.push(novo);
  salvar(banco);
  return novo;
}

export function cadastrarEpi(e: Omit<Epi, "id">): Epi {
  const banco = carregar();
  const novo = { ...e, id: crypto.randomUUID() };
  banco.epis.push(novo);
  salvar(banco);
  return novo;
}
