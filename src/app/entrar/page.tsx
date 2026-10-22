"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icone } from "@/components/ui";
import { CONSULTORIA } from "@/lib/consultoria";
import { entrar, entrarComSenha } from "@/lib/sessao";
import { comServidor } from "@/lib/supabase";

export default function Entrar() {
  const roteador = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function acessar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (!comServidor) {
      if (!nome.trim()) return;
      entrar(nome.trim());
      roteador.replace("/retirada");
      return;
    }
    setEnviando(true);
    try {
      await entrarComSenha(email.trim(), senha);
      roteador.replace("/retirada");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível entrar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="entrar">
      <div className="entrar-logo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={CONSULTORIA.logo} alt={CONSULTORIA.nome} width={230} height={133} />
      </div>
      <h1>Ficha de EPI</h1>
      <p className="suave">Entre para registrar as entregas do almoxarifado.</p>

      <form onSubmit={acessar} className="entrar-cartao">
        {erro && <div className="aviso-caixa erro" role="alert"><Icone nome="alerta" tamanho={20} />{erro}</div>}
        {comServidor ? (
          <>
            <label className="campo">
              <span>E-mail</span>
              <input type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
            </label>
            <label className="campo">
              <span>Senha</span>
              <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" required />
            </label>
            <button className="botao" type="submit" disabled={enviando}>{enviando ? "Entrando…" : "Entrar"}</button>
          </>
        ) : (
          <>
            <label className="campo">
              <span>Seu nome</span>
              <input value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" placeholder="Ex.: Ana Lima" required />
            </label>
            <button className="botao" type="submit" disabled={!nome.trim()}>Entrar</button>
          </>
        )}
      </form>
      {!comServidor && <p className="entrar-rodape">Versão de demonstração: os dados ficam só neste aparelho.</p>}
    </main>
  );
}
