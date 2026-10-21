"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { temSessao } from "@/lib/sessao";

const ABAS = [
  { href: "/retirada", rotulo: "Entregar", icone: "M12 3v12m0 0-4-4m4 4 4-4M5 19h14" },
  { href: "/funcionarios", rotulo: "Pessoas", icone: "M16 11a4 4 0 1 0-8 0m-3 9a7 7 0 0 1 14 0" },
  { href: "/epis", rotulo: "EPIs", icone: "M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.500 7-4.500 7-9V6z" },
  { href: "/historico", rotulo: "Fichas", icone: "M7 3h8l4 4v14H7zM14 3v5h5M10 13h6M10 17h6" },
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

  return (
    <>
      {children}
      {!publica && (
        <nav className="nav" aria-label="Principal">
          {ABAS.map((aba) => (
            <Link key={aba.href} href={aba.href} aria-current={caminho.startsWith(aba.href) ? "page" : undefined}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={aba.icone} />
              </svg>
              {aba.rotulo}
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}
