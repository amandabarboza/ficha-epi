"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { repo } from "@/lib/dados";
import type { Entrega, Funcionario } from "@/lib/tipos";

function Ficha() {
  const id = useSearchParams().get("f");
  const [pessoa, setPessoa] = useState<Funcionario | null>(null);
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    repo.listar().then((b) => {
      setPessoa(b.funcionarios.find((f) => f.id === id) ?? null);
      setEntregas(b.entregas.filter((e) => e.funcionarioId === id));
      setCarregado(true);
    });
  }, [id]);

  if (!carregado) return <main className="pagina"><p className="suave">Carregando…</p></main>;
  if (!pessoa) return <main className="pagina"><p>Funcionário não encontrado.</p></main>;

  return (
    <main className="pagina ficha" style={{ maxWidth: 900 }}>
      <button className="botao nao-imprimir" onClick={() => window.print()} style={{ marginBottom: 16 }}>
        Imprimir ou salvar em PDF
      </button>
      <h1>Ficha de controle de EPI</h1>
      <p><strong>{pessoa.nome}</strong> · Matrícula {pessoa.matricula} · {pessoa.funcao}</p>
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
              <td>{e.tipo}</td>
              <td>{e.epiNome}</td>
              <td>{e.ca}</td>
              <td>{e.lote}</td>
              <td>{e.quantidade}</td>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <td><img src={e.assinatura} alt="Assinatura" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

export default function Pagina() {
  return <Suspense><Ficha /></Suspense>;
}
