"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icone } from "@/components/ui";
import { CONSULTORIA } from "@/lib/consultoria";
import { repo, type Empresa } from "@/lib/dados";
import type { Entrega, Funcionario } from "@/lib/tipos";

const MOVIMENTO = { entrega: "Entrega", devolucao: "Devolução", troca: "Troca" } as const;

function Ficha() {
  const id = useSearchParams().get("f");
  const roteador = useRouter();
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [pessoa, setPessoa] = useState<Funcionario | null>(null);
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    repo.listar().then((b) => {
      setEmpresa(b.empresa);
      setPessoa(b.funcionarios.find((f) => f.id === id) ?? null);
      setEntregas(b.entregas.filter((e) => e.funcionarioId === id));
      setCarregado(true);
    });
  }, [id]);

  if (!carregado) return <main className="pagina"><p className="suave">Carregando…</p></main>;
  if (!pessoa) return <main className="pagina"><p>Funcionário não encontrado.</p></main>;

  // O logo já traz o nome da consultoria; ao lado vai só o contato, um item por linha.
  const contato = [
    CONSULTORIA.telefone,
    CONSULTORIA.email,
    CONSULTORIA.site,
    CONSULTORIA.cnpj && `CNPJ ${CONSULTORIA.cnpj}`,
    CONSULTORIA.endereco,
  ].filter(Boolean);

  return (
    <main className="pagina ficha" style={{ maxWidth: 900 }}>
      <div className="ficha-acoes nao-imprimir">
        <button type="button" className="botao-icone" onClick={() => roteador.back()} aria-label="Voltar">
          <Icone nome="voltar" />
        </button>
        <button className="botao" onClick={() => window.print()}>
          <Icone nome="imprimir" /> Imprimir ou salvar PDF
        </button>
      </div>
      <div className="ficha-folha">

      <header className="ficha-topo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={CONSULTORIA.logo} alt={CONSULTORIA.nome} />
        <address className="dados">
          {contato.map((linha) => <div key={linha}>{linha}</div>)}
        </address>
      </header>

      <h1 className="ficha-titulo">Ficha de controle de entrega de EPI</h1>

      <section className="ficha-identificacao">
        <div><strong>Empresa:</strong> {empresa?.nome || "—"}</div>
        <div><strong>CNPJ:</strong> {empresa?.cnpj || "—"}</div>
        <div><strong>Funcionário:</strong> {pessoa.nome}</div>
        <div><strong>Matrícula:</strong> {pessoa.matricula}</div>
        <div><strong>Função:</strong> {pessoa.funcao || "—"}</div>
        <div><strong>Emitida em:</strong> {new Date().toLocaleDateString("pt-BR")}</div>
      </section>

      <p className="ficha-declaracao">
        Declaro ter recebido os equipamentos de proteção individual abaixo, estar orientado quanto ao uso correto e
        comprometo-me a conservá-los e a comunicar qualquer dano.
      </p>
      <div className="ficha-rolagem">
      <table>
        <thead>
          <tr><th>Data</th><th>Movimento</th><th>EPI</th><th>CA</th><th>Lote</th><th>Qtd</th><th>Assinatura</th></tr>
        </thead>
        <tbody>
          {entregas.length === 0 && <tr><td colSpan={7}>Nenhum registro.</td></tr>}
          {entregas.map((e) => (
            <tr key={e.id}>
              <td>{new Date(e.criadoEm).toLocaleString("pt-BR")}</td>
              <td>{MOVIMENTO[e.tipo]}</td>
              <td>{e.epiNome}</td>
              <td>{e.ca}</td>
              <td>{e.lote}</td>
              <td>{e.quantidade}</td>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <td>{e.assinatura ? <img src={e.assinatura} alt="Assinatura" /> : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <div className="ficha-assinaturas">
        <div>{pessoa.nome}</div>
        <div>Responsável pela segurança do trabalho</div>
      </div>
      </div>
    </main>
  );
}

export default function Pagina() {
  return <Suspense><Ficha /></Suspense>;
}
