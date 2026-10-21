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
