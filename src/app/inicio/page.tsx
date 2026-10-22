"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BotaoSair } from "@/components/Casca";
import { Ilustracao } from "@/components/Ilustracao";
import { EtiquetaCA } from "@/components/ui";
import { CONSULTORIA } from "@/lib/consultoria";
import { caVencido, diasParaVencer, repo, type Dados } from "@/lib/dados";

function saudacao() {
  const h = new Date().getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

export default function Inicio() {
  const [dados, setDados] = useState<Dados | null>(null);

  useEffect(() => {
    repo.listar().then(setDados).catch(() => setDados(null));
  }, []);

  const primeiroNome = dados?.usuario.split(" ")[0];
  const alertas = dados?.epis.filter((e) => caVencido(e) || diasParaVencer(e) <= 30 || e.estoque <= e.estoqueMinimo).length ?? 0;
  const hoje = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const nome = (id: string) => dados?.funcionarios.find((f) => f.id === id)?.nome ?? "—";

  return (
    <main>
      <header className="heroi">
        <div className="heroi-conteudo">
          <div className="heroi-topo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={CONSULTORIA.logoNegativo} alt={CONSULTORIA.nome} />
            <BotaoSair />
          </div>
          <h1>{saudacao()}{primeiroNome ? `, ${primeiroNome}` : ""}</h1>
          <p>{hoje.charAt(0).toUpperCase() + hoje.slice(1)}{dados?.empresa.nome ? ` · ${dados.empresa.nome}` : ""}</p>
        </div>
      </header>

      <div className="painel-atalhos">
        <nav className="atalhos" aria-label="Atalhos">
          <Link href="/retirada" className="atalho atalho-principal">
            <span className="ilustracao"><Ilustracao nome="entrega" /></span>
            <span>
              <strong>Nova entrega</strong>
              <span>Registrar EPI para um funcionário</span>
            </span>
          </Link>
          <Link href="/funcionarios" className="atalho">
            <span className="ilustracao"><Ilustracao nome="pessoas" /></span>
            Pessoas
          </Link>
          <Link href="/epis" className="atalho">
            <span className="ilustracao"><Ilustracao nome="epis" /></span>
            EPIs
          </Link>
          <Link href="/historico" className="atalho">
            <span className="ilustracao"><Ilustracao nome="fichas" /></span>
            Fichas
          </Link>
          <Link href="/epis?filtro=alertas" className="atalho">
            {alertas > 0 && <span className="contagem" aria-label={`${alertas} alertas`}>{alertas}</span>}
            <span className="ilustracao"><Ilustracao nome="alertas" /></span>
            Alertas
          </Link>
        </nav>
      </div>

      <section className="pagina" style={{ paddingTop: 0 }}>
        <h2 className="secao-titulo">Últimas entregas</h2>
        {dados && dados.entregas.length === 0 ? (
          <p className="suave" style={{ padding: "0 4px" }}>Nenhuma entrega registrada ainda.</p>
        ) : (
          <ul className="lista">
            {[...(dados?.entregas ?? [])].reverse().slice(0, 4).map((e) => (
              <li key={e.id} className="item">
                <EtiquetaCA ca={e.ca} />
                <span className="item-textos">
                  <span className="item-titulo">{e.epiNome}</span>
                  <span className="item-detalhe">{nome(e.funcionarioId)}</span>
                </span>
                <span className="item-detalhe" style={{ marginTop: 0 }}>
                  {new Date(e.criadoEm).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
