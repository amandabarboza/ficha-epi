"use client";

import { sha256 } from "./hash";
import { comServidor, supabase } from "./supabase";
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

function carregar(): Banco {
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

async function registrarLocal(p: PedidoEntrega): Promise<Entrega> {
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

function cadastrarFuncionarioLocal(f: Omit<Funcionario, "id">): Funcionario {
  const banco = carregar();
  if (banco.funcionarios.some((x) => x.matricula === f.matricula)) {
    throw new Error("Já existe um funcionário com essa matrícula.");
  }
  const novo = { ...f, id: crypto.randomUUID() };
  banco.funcionarios.push(novo);
  salvar(banco);
  return novo;
}

function cadastrarEpiLocal(e: Omit<Epi, "id">): Epi {
  const banco = carregar();
  const novo = { ...e, id: crypto.randomUUID() };
  banco.epis.push(novo);
  salvar(banco);
  return novo;
}

// ---------------------------------------------------------------------------
// Camada única usada pelas telas: Supabase quando configurado, senão demonstração
// ---------------------------------------------------------------------------

export type Dados = { funcionarios: Funcionario[]; epis: Epi[]; entregas: Entrega[] };

type LinhaFuncionario = { id: string; nome: string; matricula: string; funcao: string | null };
type LinhaEpi = { id: string; nome: string; ca: string; validade_ca: string; lote: string | null; estoque: number; estoque_minimo: number };
type LinhaEntrega = {
  id: string; funcionario_id: string; epi_id: string; tipo: TipoMovimento; quantidade: number;
  epi_nome: string; ca: string; lote: string | null; assinatura: string; criado_em: string;
  hash_anterior: string | null; hash: string; usuarios: { nome: string } | null;
};

async function tenantDoUsuario(): Promise<{ tenant: string; usuario: string }> {
  const { data: auth } = await supabase().auth.getUser();
  if (!auth.user) throw new Error("Sessão expirada. Entre de novo.");
  const { data, error } = await supabase().from("usuarios").select("tenant_id").eq("id", auth.user.id).single();
  if (error || !data) throw new Error("Seu usuário não está ligado a nenhuma empresa. Fale com o administrador.");
  return { tenant: data.tenant_id as string, usuario: auth.user.id };
}

function mensagem(e: { message: string }): string {
  // Erros que o banco escreve em português (CA vencido, estoque, PIN bloqueado) vão direto para a tela.
  return e.message || "Não foi possível concluir. Tente de novo.";
}

async function listarServidor(): Promise<Dados> {
  const sb = supabase();
  const [f, e, d] = await Promise.all([
    sb.from("funcionarios").select("id,nome,matricula,funcao").eq("ativo", true).order("nome"),
    sb.from("epis").select("id,nome,ca,validade_ca,lote,estoque,estoque_minimo").eq("ativo", true).order("nome"),
    sb.from("entregas")
      .select("id,funcionario_id,epi_id,tipo,quantidade,epi_nome,ca,lote,assinatura,criado_em,hash_anterior,hash,usuarios(nome)")
      .order("criado_em", { ascending: true }),
  ]);
  const erro = f.error ?? e.error ?? d.error;
  if (erro) throw new Error(mensagem(erro));

  const linhas = (d.data ?? []) as unknown as LinhaEntrega[];
  const urls = new Map<string, string>();
  if (linhas.length) {
    const { data: assinados } = await sb.storage.from("assinaturas").createSignedUrls(linhas.map((l) => l.assinatura), 3600);
    assinados?.forEach((a) => a.path && a.signedUrl && urls.set(a.path, a.signedUrl));
  }

  return {
    funcionarios: ((f.data ?? []) as LinhaFuncionario[]).map((x) => ({ id: x.id, nome: x.nome, matricula: x.matricula, funcao: x.funcao ?? "" })),
    epis: ((e.data ?? []) as LinhaEpi[]).map((x) => ({
      id: x.id, nome: x.nome, ca: x.ca, validadeCa: x.validade_ca, lote: x.lote ?? "", estoque: x.estoque, estoqueMinimo: x.estoque_minimo,
    })),
    entregas: linhas.map((x) => ({
      id: x.id, funcionarioId: x.funcionario_id, epiId: x.epi_id, tipo: x.tipo, quantidade: x.quantidade,
      epiNome: x.epi_nome, ca: x.ca, lote: x.lote ?? "",
      assinatura: urls.get(x.assinatura) ?? "", // URL temporária para exibir
      almoxarife: x.usuarios?.nome ?? "", criadoEm: x.criado_em, hashAnterior: x.hash_anterior, hash: x.hash,
    })),
  };
}

async function dataUrlParaBlob(dataUrl: string): Promise<Blob> {
  return (await fetch(dataUrl)).blob();
}

async function registrarServidor(p: PedidoEntrega): Promise<Entrega> {
  const sb = supabase();
  const { tenant, usuario } = await tenantDoUsuario();

  const caminho = `${tenant}/${crypto.randomUUID()}.png`;
  const { error: erroArquivo } = await sb.storage.from("assinaturas").upload(caminho, await dataUrlParaBlob(p.assinatura), { contentType: "image/png" });
  if (erroArquivo) throw new Error("Não foi possível salvar a assinatura. Tente de novo.");

  const { data, error } = await sb
    .from("entregas")
    .insert({
      tenant_id: tenant,
      funcionario_id: p.funcionarioId,
      epi_id: p.epiId,
      tipo: p.tipo,
      quantidade: p.quantidade,
      assinatura: caminho,
      almoxarife_id: usuario,
      criado_em_aparelho: new Date().toISOString(),
    })
    .select("id,funcionario_id,epi_id,tipo,quantidade,epi_nome,ca,lote,criado_em,hash_anterior,hash")
    .single();
  if (error) throw new Error(mensagem(error));

  return {
    id: data.id, funcionarioId: data.funcionario_id, epiId: data.epi_id, tipo: data.tipo, quantidade: data.quantidade,
    epiNome: data.epi_nome, ca: data.ca, lote: data.lote ?? "", assinatura: p.assinatura, almoxarife: "",
    criadoEm: data.criado_em, hashAnterior: data.hash_anterior, hash: data.hash,
  };
}

export const repo = {
  comServidor,

  async listar(): Promise<Dados> {
    return comServidor ? listarServidor() : carregar();
  },

  registrarEntrega(p: PedidoEntrega): Promise<Entrega> {
    return comServidor ? registrarServidor(p) : registrarLocal(p);
  },

  async verificarPin(funcionarioId: string, pin: string): Promise<boolean> {
    if (!comServidor) return carregar().funcionarios.find((f) => f.id === funcionarioId)?.pin === pin;
    const { data, error } = await supabase().rpc("verificar_pin", { p_funcionario: funcionarioId, p_pin: pin });
    if (error) throw new Error(mensagem(error));
    return data === true;
  },

  async cadastrarFuncionario(f: Omit<Funcionario, "id"> & { pin: string }): Promise<void> {
    if (!comServidor) {
      cadastrarFuncionarioLocal(f);
      return;
    }
    const { tenant } = await tenantDoUsuario();
    const { data, error } = await supabase()
      .from("funcionarios")
      .insert({ tenant_id: tenant, nome: f.nome, matricula: f.matricula, funcao: f.funcao })
      .select("id")
      .single();
    if (error) {
      throw new Error(error.code === "23505" ? "Já existe um funcionário com essa matrícula." : mensagem(error));
    }
    const { error: erroPin } = await supabase().rpc("definir_pin", { p_funcionario: data.id, p_pin: f.pin });
    if (erroPin) throw new Error(mensagem(erroPin));
  },

  async cadastrarEpi(e: Omit<Epi, "id">): Promise<void> {
    if (!comServidor) {
      cadastrarEpiLocal(e);
      return;
    }
    const { tenant } = await tenantDoUsuario();
    const { error } = await supabase().from("epis").insert({
      tenant_id: tenant, nome: e.nome, ca: e.ca, validade_ca: e.validadeCa, lote: e.lote || null,
      estoque: e.estoque, estoque_minimo: e.estoqueMinimo,
    });
    if (error) throw new Error(mensagem(error));
  },
};
