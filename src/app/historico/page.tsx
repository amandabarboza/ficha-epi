"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Avatar, Busca, CabecalhoPagina, Icone, Vazio } from "@/components/ui";
import { repo, verificarCadeia } from "@/lib/dados";
import type { Entrega, Funcionario } from "@/lib/tipos";

const dataCurta = (iso: string) => new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

export default function Historico() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [integra, setIntegra] = useState<boolean | null>(null);

  useEffect(() => {
    repo.listar()
      .then((b) => {
        setFuncionarios(b.funcionarios);
        setEntregas(b.entregas);
        // No servidor o encadeamento é garantido pelo banco; aqui confere a cópia local.
        if (!repo.comServidor) verificarCadeia(b.entregas).then(setIntegra);
      })
      .finally(() => setCarregando(false));
  }, []);

  const porPessoa = useMemo(() => {
    const mapa = new Map<string, { qtd: number; ultima?: string }>();
    for (const e of entregas) {
      const atual = mapa.get(e.funcionarioId) ?? { qtd: 0 };
      mapa.set(e.funcionarioId, { qtd: atual.qtd + 1, ultima: e.criadoEm });
    }
    return mapa;
  }, [entregas]);

  const nome = (id: string) => funcionarios.find((f) => f.id === id)?.nome ?? "—";

  const filtrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return t ? funcionarios.filter((f) => f.nome.toLowerCase().includes(t) || f.matricula.includes(t)) : funcionarios;
  }, [busca, funcionarios]);

  return (
    <main className="pagina">
      <CabecalhoPagina titulo="Fichas" subtitulo="Escolha o funcionário para ver e imprimir a ficha." />

      {integra === false && (
        <div className="aviso-caixa erro" role="alert">
          <Icone nome="alerta" tamanho={20} />
          Os registros foram alterados fora do app. Avise o responsável.
        </div>
      )}

      {funcionarios.length > 5 && <Busca valor={busca} onMudar={setBusca} rotulo="Buscar funcionário" />}

      {!carregando && filtrados.length === 0 ? (
        <Vazio icone="ficha" titulo="Nenhum funcionário encontrado" />
      ) : (
        <ul className="lista">
          {filtrados.map((f) => {
            const info = porPessoa.get(f.id);
            return (
              <li key={f.id}>
                <Link href={`/ficha?f=${f.id}`} className="item">
                  <Avatar nome={f.nome} />
                  <span className="item-textos">
                    <span className="item-titulo">{f.nome}</span>
                    <span className="item-detalhe">
                      {info ? `${info.qtd} ${info.qtd === 1 ? "registro" : "registros"} · último em ${new Date(info.ultima!).toLocaleDateString("pt-BR")}` : "Nenhum registro ainda"}
                    </span>
                  </span>
                  <Icone nome="seta" className="item-seta" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <h2 className="secao-titulo">Últimas entregas</h2>
      {!carregando && entregas.length === 0 ? (
        <Vazio icone="relogio" titulo="Nenhuma entrega ainda" texto="As entregas aparecem aqui assim que forem registradas." />
      ) : (
        <ul className="lista">
          {[...entregas].reverse().slice(0, 15).map((e) => (
            <li key={e.id} className="item">
              <span className="item-icone"><Icone nome="escudo" /></span>
              <span className="item-textos">
                <span className="item-titulo">{e.epiNome}</span>
                <span className="item-detalhe">{nome(e.funcionarioId)} · {dataCurta(e.criadoEm)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
