"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CONSULTORIA } from "@/lib/consultoria";
import { encerrarSessao, temSessao } from "@/lib/sessao";
import { Icone, type NomeIcone } from "./ui";

type Aba = { href: string; rotulo: string; icone: NomeIcone };
const ESQUERDA: Aba[] = [
  { href: "/inicio", rotulo: "Início", icone: "inicio" },
  { href: "/funcionarios", rotulo: "Pessoas", icone: "pessoas" },
];
const DIREITA: Aba[] = [
  { href: "/epis", rotulo: "EPIs", icone: "escudo" },
  { href: "/historico", rotulo: "Fichas", icone: "ficha" },
];

export function Casca({ children }: { children: React.ReactNode }) {
  const caminho = usePathname();
  const roteador = useRouter();
  const [pronto, setPronto] = useState(false);
  const publica = caminho === "/entrar";
  // O Início tem topo próprio (com saudação); as demais telas usam a barra com o logo
  const comBarra = !publica && caminho !== "/inicio";

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  useEffect(() => {
    let ativo = true;
    temSessao().then((ok) => {
      if (!ativo) return;
      if (!publica && !ok) roteador.replace("/entrar");
      else setPronto(true);
    });
    return () => {
      ativo = false;
    };
  }, [publica, roteador, caminho]);

  if (!publica && !pronto) return null;

  const aba = (a: Aba) => {
    const atual = caminho.startsWith(a.href) || (a.href === "/historico" && caminho === "/ficha");
    return (
      <Link key={a.href} href={a.href} aria-current={atual ? "page" : undefined}>
        <Icone nome={a.icone} tamanho={24} />
        {a.rotulo}
      </Link>
    );
  };

  return (
    <>
      {comBarra && (
        <header className="barra nao-imprimir">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="logo-claro" src={CONSULTORIA.logo} alt={CONSULTORIA.nome} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="logo-escuro" src={CONSULTORIA.logoNegativo} alt="" />
          <BotaoSair />
        </header>
      )}
      {children}
      {!publica && (
        <>
          <nav className="nav nao-imprimir" aria-label="Principal">
            <div className="nav-itens">
              {ESQUERDA.map(aba)}
              <span aria-hidden="true" />
              {DIREITA.map(aba)}
            </div>
          </nav>
          <Link className="fab nao-imprimir" href="/retirada" aria-label="Nova entrega de EPI" aria-current={caminho === "/retirada" ? "page" : undefined}>
            <Icone nome="mais" tamanho={30} />
          </Link>
        </>
      )}
    </>
  );
}

export function BotaoSair() {
  const roteador = useRouter();
  async function sair() {
    await encerrarSessao();
    roteador.replace("/entrar");
  }
  return (
    <button type="button" className="sair" onClick={sair} aria-label="Sair">
      <Icone nome="sair" tamanho={20} />
    </button>
  );
}
