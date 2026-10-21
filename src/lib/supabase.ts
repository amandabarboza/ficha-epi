"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Sem as duas variáveis o app roda em modo demonstração (dados só no aparelho).
export const comServidor = Boolean(url && chave);

let cliente: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (!url || !chave) throw new Error("Supabase não configurado.");
  cliente ??= createClient(url, chave, { auth: { persistSession: true, autoRefreshToken: true } });
  return cliente;
}
