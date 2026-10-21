"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { entrar } from "@/lib/sessao";

export default function Entrar() {
  const roteador = useRouter();
  const [nome, setNome] = useState("");

  function acessar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    entrar(nome.trim());
    roteador.replace("/retirada");
  }

  return (
    <main className="pagina">
      <div style={{ textAlign: "center", padding: "32px 0 24px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-192.png" width={96} height={96} alt="" style={{ borderRadius: 24 }} />
        <h1 style={{ marginTop: 16 }}>Ficha de EPI</h1>
        <p className="suave">Quem está no almoxarifado agora?</p>
      </div>
      <form onSubmit={acessar}>
        <label className="campo">
          <span>Seu nome</span>
          <input value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" placeholder="Ex.: Ana Lima" required />
        </label>
        <button className="botao" type="submit" disabled={!nome.trim()}>Entrar</button>
      </form>
      <p className="suave" style={{ marginTop: 24, fontSize: 15 }}>
        Versão de demonstração: os dados ficam só neste aparelho. O acesso com digital ou Face ID entra junto com a conexão ao servidor.
      </p>
    </main>
  );
}
