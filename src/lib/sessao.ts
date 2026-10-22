"use client";

const CHAVE = "ficha-epi:sessao";

export function lerSessao(): string | null {
  try {
    return localStorage.getItem(CHAVE);
  } catch {
    return null;
  }
}

export function entrar(nome: string) {
  try {
    localStorage.setItem(CHAVE, nome);
  } catch {
    // sem armazenamento: a sessão vale só até recarregar
  }
}

export function sair() {
  try {
    localStorage.removeItem(CHAVE);
  } catch {
    // nada a limpar
  }
}

// ---------------------------------------------------------------------------
// Com Supabase: e-mail e senha do almoxarife. Sem Supabase: só o nome (demonstração).
// ---------------------------------------------------------------------------

export async function encerrarSessao(): Promise<void> {
  const { comServidor, supabase } = await import("./supabase");
  sair();
  if (comServidor) await supabase().auth.signOut();
}

export async function temSessao(): Promise<boolean> {
  const { comServidor, supabase } = await import("./supabase");
  if (!comServidor) return lerSessao() !== null;
  const { data } = await supabase().auth.getSession();
  return data.session !== null;
}

export async function entrarComSenha(email: string, senha: string): Promise<void> {
  const { supabase } = await import("./supabase");
  const { data, error } = await supabase().auth.signInWithPassword({ email, password: senha });
  if (error) throw new Error("E-mail ou senha incorretos.");

  // Sem empresa o app não tem o que mostrar: barra já na entrada, não no meio de um cadastro.
  const { data: usuario } = await supabase().from("usuarios").select("id").eq("id", data.user.id).maybeSingle();
  if (!usuario) {
    await supabase().auth.signOut();
    throw new Error("Este acesso ainda não foi liberado para nenhuma empresa. Fale com o responsável pela segurança do trabalho.");
  }
}
