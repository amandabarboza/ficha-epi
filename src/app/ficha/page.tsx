"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CONSULTORIA } from "@/lib/consultoria";
import { repo, type Empresa } from "@/lib/dados";
import type { Entrega, Funcionario } from "@/lib/tipos";

const MOVIMENTO = { entrega: "Entrega", devolucao: "Devolução", troca: "Troca" } as const;

function Ficha() {
  const id = useSearchParams().get("f");
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

  const contato = [CONSULTORIA.telefone, CONSULTORIA.email, CONSULTORIA.site].filter(Boolean).join(" · ");

  return (
    <main className="pagina ficha" style={{ maxWidth: 900 }}>
      <button className="botao nao-imprimir" onClick={() => window.print()} style={{ marginBottom: 16 }}>
        Imprimir ou salvar em PDF
      </button>

      <header className="ficha-topo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={CONSULTORIA.logo} alt={CONSULTORIA.nome} />
        <div className="dados">
          <strong>{CONSULTORIA.nome}</strong>
          {CONSULTORIA.cnpj && <div>CNPJ {CONSULTORIA.cnpj}</div>}
          {CONSULTORIA.endereco && <div>{CONSULTORIA.endereco}</div>}
          {contato && <div>{contato}</div>}
        </div>
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

      <p style={{ fontSize: 13 }}>
        Declaro ter recebido os equipamentos de proteção individual abaixo, estar orientado quanto ao uso correto e
        comprometo-me a conservá-los e a comunicar qualquer dano.
      </p>
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

      <div className="ficha-assinaturas">
        <div>{pessoa.nome}</div>
        <div>Responsável pela segurança do trabalho</div>
      </div>
    </main>
  );
}

export default function Pagina() {
  return <Suspense><Ficha /></Suspense>;
}
