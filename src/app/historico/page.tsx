"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { carregar, verificarCadeia } from "@/lib/dados";
import type { Entrega, Funcionario } from "@/lib/tipos";

export default function Historico() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [integra, setIntegra] = useState<boolean | null>(null);

  useEffect(() => {
    const b = carregar();
    setFuncionarios(b.funcionarios);
    setEntregas(b.entregas);
    verificarCadeia(b.entregas).then(setIntegra);
  }, []);

  return (
    <main className="pagina">
      <h1>Fichas</h1>
      <p className="suave">Toque em um funcionário para ver e imprimir a ficha.</p>

      {integra === false && (
        <div className="aviso-caixa erro" role="alert">Os registros foram alterados fora do app. Avise o responsável.</div>
      )}

      {funcionarios.map((f) => {
        const qtd = entregas.filter((e) => e.funcionarioId === f.id).length;
        return (
          <Link key={f.id} href={`/ficha?f=${f.id}`} className="cartao-botao" style={{ textDecoration: "none" }}>
            <span className="avatar">{f.nome[0]}</span>
            <span style={{ flex: 1 }}>
              <span className="titulo">{f.nome}</span>
              <span className="detalhe">{qtd} {qtd === 1 ? "registro" : "registros"}</span>
            </span>
          </Link>
        );
      })}

      <h2 style={{ marginTop: 24 }}>Últimas entregas</h2>
      {entregas.length === 0 && <p className="suave">Nenhuma entrega registrada ainda.</p>}
      {[...entregas].reverse().slice(0, 20).map((e) => (
        <div key={e.id} className="cartao">
          <strong>{e.epiNome}</strong> <span className="suave">· CA {e.ca}</span>
          <div className="suave">
            {funcionarios.find((f) => f.id === e.funcionarioId)?.nome ?? "—"} · {new Date(e.criadoEm).toLocaleString("pt-BR")}
          </div>
        </div>
      ))}
    </main>
  );
}
