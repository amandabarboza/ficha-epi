"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Avatar, Busca, CabecalhoPagina, Folha, Icone, Vazio } from "@/components/ui";
import { repo } from "@/lib/dados";
import type { Funcionario } from "@/lib/tipos";

const VAZIO = { nome: "", matricula: "", funcao: "", pin: "" };

export default function Funcionarios() {
  const [lista, setLista] = useState<Funcionario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [novo, setNovo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [form, setForm] = useState(VAZIO);

  function recarregar() {
    repo.listar()
      .then((b) => setLista(b.funcionarios))
      .catch((e: Error) => setErro(e.message))
      .finally(() => setCarregando(false));
  }
  useEffect(recarregar, []);

  const fechar = useCallback(() => {
    setNovo(false);
    setErro("");
  }, []);

  const filtrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return t ? lista.filter((f) => f.nome.toLowerCase().includes(t) || f.matricula.includes(t)) : lista;
  }, [busca, lista]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (!/^\d{4}$/.test(form.pin)) {
      setErro("O PIN precisa ter 4 números.");
      return;
    }
    setSalvando(true);
    try {
      await repo.cadastrarFuncionario({ ...form, nome: form.nome.trim() });
      recarregar();
      setForm(VAZIO);
      fechar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="pagina">
      <CabecalhoPagina
        titulo="Pessoas"
        subtitulo={carregando ? undefined : `${lista.length} ${lista.length === 1 ? "funcionário" : "funcionários"}`}
        acao={
          <button className="botao-pilula" onClick={() => setNovo(true)}>
            <Icone nome="mais" tamanho={20} /> Novo
          </button>
        }
      />

      {lista.length > 5 && <Busca valor={busca} onMudar={setBusca} rotulo="Buscar por nome ou matrícula" />}

      {!carregando && filtrados.length === 0 ? (
        <Vazio icone="pessoas" titulo={busca ? "Ninguém encontrado" : "Nenhum funcionário ainda"} texto={busca ? undefined : "Toque em Novo para cadastrar."} />
      ) : (
        <ul className="lista">
          {filtrados.map((f) => (
            <li key={f.id}>
              <Link className="item" href={`/ficha?f=${f.id}`}>
                <Avatar nome={f.nome} />
                <span className="item-textos">
                  <span className="item-titulo">{f.nome}</span>
                  <span className="item-detalhe">Matrícula {f.matricula}{f.funcao && ` · ${f.funcao}`}</span>
                </span>
                <Icone nome="seta" className="item-seta" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Folha aberta={novo} titulo="Novo funcionário" onFechar={fechar}>
        <form onSubmit={salvar}>
          {erro && <div className="aviso-caixa erro" role="alert"><Icone nome="alerta" tamanho={20} />{erro}</div>}
          <label className="campo"><span>Nome completo</span>
            <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} autoComplete="off" required />
          </label>
          <div className="campos-2">
            <label className="campo"><span>Matrícula</span>
              <input inputMode="numeric" value={form.matricula} onChange={(e) => setForm({ ...form, matricula: e.target.value })} required />
            </label>
            <label className="campo"><span>PIN</span>
              <input inputMode="numeric" maxLength={4} type="password" value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, "") })} required />
            </label>
          </div>
          <label className="campo"><span>Função</span>
            <input value={form.funcao} onChange={(e) => setForm({ ...form, funcao: e.target.value })} placeholder="Ex.: Soldador" />
            <small>O PIN tem 4 números e é usado pelo funcionário para confirmar cada entrega.</small>
          </label>
          <button className="botao" type="submit" disabled={salvando}>{salvando ? "Salvando…" : "Cadastrar funcionário"}</button>
        </form>
      </Folha>
    </main>
  );
}
