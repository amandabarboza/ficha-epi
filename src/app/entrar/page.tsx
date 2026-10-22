"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { entrar, entrarComSenha } from "@/lib/sessao";
import { CONSULTORIA } from "@/lib/consultoria";
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
    <main className="pagina">
      <div style={{ textAlign: "center", padding: "32px 0 24px" }}>
        <div className="logo-caixa">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={CONSULTORIA.logo} alt={CONSULTORIA.nome} width={220} height={127} />
        </div>
        <h1 style={{ marginTop: 16 }}>Ficha de EPI</h1>
        <p className="suave">Quem está no almoxarifado agora?</p>
      </div>
      <form onSubmit={acessar}>
        {erro && <div className="aviso-caixa erro" role="alert">{erro}</div>}
        {comServidor ? (
          <>
            <label className="campo">
              <span>E-mail</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
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
            <p className="suave" style={{ marginTop: 24, fontSize: 15 }}>
              Versão de demonstração: os dados ficam só neste aparelho.
            </p>
          </>
        )}
      </form>
    </main>
  );
}
