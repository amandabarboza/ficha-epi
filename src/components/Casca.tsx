"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CONSULTORIA } from "@/lib/consultoria";
import { encerrarSessao, temSessao } from "@/lib/sessao";
import { Icone, type NomeIcone } from "./ui";

const ABAS: { href: string; rotulo: string; icone: NomeIcone }[] = [
  { href: "/retirada", rotulo: "Entregar", icone: "entrega" },
  { href: "/funcionarios", rotulo: "Pessoas", icone: "pessoas" },
  { href: "/epis", rotulo: "EPIs", icone: "escudo" },
  { href: "/historico", rotulo: "Fichas", icone: "ficha" },
];

export function Casca({ children }: { children: React.ReactNode }) {
  const caminho = usePathname();
  const roteador = useRouter();
  const [pronto, setPronto] = useState(false);
  const publica = caminho === "/entrar";

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

  async function sairDoApp() {
    await encerrarSessao();
    roteador.replace("/entrar");
  }

  return (
    <>
      {!publica && (
        <header className="cabecalho nao-imprimir">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={CONSULTORIA.logo} alt={CONSULTORIA.nome} />
          <button type="button" className="sair" onClick={sairDoApp}>
            <Icone nome="sair" tamanho={18} />
            Sair
          </button>
        </header>
      )}
      {children}
      {!publica && (
        <nav className="nav nao-imprimir" aria-label="Principal">
          {ABAS.map((aba) => {
            const atual = caminho.startsWith(aba.href) || (aba.href === "/historico" && caminho === "/ficha");
            return (
              <Link key={aba.href} href={aba.href} aria-current={atual ? "page" : undefined}>
                <span className="nav-icone"><Icone nome={aba.icone} /></span>
                {aba.rotulo}
              </Link>
            );
          })}
        </nav>
      )}
    </>
  );
}
