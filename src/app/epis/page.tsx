"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CabecalhoPagina, EtiquetaCA, Folha, Icone, Vazio } from "@/components/ui";
import { caVencido, diasParaVencer, repo } from "@/lib/dados";
import type { Epi } from "@/lib/tipos";

const VAZIO = { nome: "", ca: "", validadeCa: "", lote: "", estoque: "", estoqueMinimo: "" };
type Filtro = "todos" | "atencao" | "bloqueados";

const estoqueBaixo = (e: Epi) => e.estoque <= e.estoqueMinimo;
const bloqueado = (e: Epi) => caVencido(e) || e.estoque <= 0;
const precisaAtencao = (e: Epi) => !bloqueado(e) && (diasParaVencer(e) <= 30 || estoqueBaixo(e));

export default function Epis() {
  const [lista, setLista] = useState<Epi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [novo, setNovo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState(VAZIO);
  const [erro, setErro] = useState("");

  function recarregar() {
    repo.listar()
      .then((b) => setLista(b.epis))
      .catch((e: Error) => setErro(e.message))
      .finally(() => setCarregando(false));
  }
  useEffect(recarregar, []);

  const fechar = useCallback(() => {
    setNovo(false);
    setErro("");
  }, []);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setSalvando(true);
    try {
      await repo.cadastrarEpi({
        nome: form.nome.trim(),
        ca: form.ca.trim(),
        validadeCa: form.validadeCa,
        lote: form.lote.trim(),
        estoque: Number(form.estoque) || 0,
        estoqueMinimo: Number(form.estoqueMinimo) || 0,
      });
      recarregar();
      setForm(VAZIO);
      fechar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  }

  const contagem = {
    todos: lista.length,
    atencao: lista.filter(precisaAtencao).length,
    bloqueados: lista.filter(bloqueado).length,
  };
  const visiveis = useMemo(() => {
    const base = filtro === "atencao" ? lista.filter(precisaAtencao) : filtro === "bloqueados" ? lista.filter(bloqueado) : lista;
    return [...base].sort((a, b) => a.nome.localeCompare(b.nome));
  }, [filtro, lista]);

  const alternar = (f: Filtro) => setFiltro((atual) => (atual === f ? "todos" : f));

  return (
    <main className="pagina">
      <CabecalhoPagina
        rotulo="Catálogo"
        titulo="EPIs"
        acao={
          <button className="botao-pilula" onClick={() => setNovo(true)}>
            <Icone nome="mais" tamanho={20} /> Novo
          </button>
        }
      />

      {!carregando && lista.length > 0 && (
        <div className="painel" role="group" aria-label="Filtrar EPIs">
          <button className="contador" aria-pressed={filtro === "todos"} onClick={() => setFiltro("todos")}>
            <strong>{contagem.todos}</strong><span>Itens</span>
          </button>
          <button className="contador aviso" aria-pressed={filtro === "atencao"} onClick={() => alternar("atencao")}>
            <strong>{contagem.atencao}</strong><span>Atenção</span>
          </button>
          <button className="contador erro" aria-pressed={filtro === "bloqueados"} onClick={() => alternar("bloqueados")}>
            <strong>{contagem.bloqueados}</strong><span>Bloqueados</span>
          </button>
        </div>
      )}

      {erro && !novo && <div className="aviso-caixa erro" role="alert"><Icone nome="alerta" tamanho={20} />{erro}</div>}

      {!carregando && visiveis.length === 0 ? (
        <Vazio icone="escudo" titulo={lista.length ? "Nada neste filtro" : "Nenhum EPI cadastrado"} texto={lista.length ? undefined : "Toque em Novo para cadastrar."} />
      ) : (
        <ul className="lista">
          {visiveis.map((e) => {
            const dias = diasParaVencer(e);
            return (
              <li key={e.id} className={bloqueado(e) ? "item bloqueado" : "item"}>
                <EtiquetaCA ca={e.ca} vencido={caVencido(e)} />
                <span className="item-textos">
                  <span className="item-titulo">{e.nome}</span>
                  {e.lote && <span className="item-detalhe">Lote {e.lote}</span>}
                  <span className="selos">
                    {caVencido(e) ? <span className="selo erro">CA vencido</span>
                      : dias <= 30 ? <span className="selo aviso">CA vence em {dias} {dias === 1 ? "dia" : "dias"}</span>
                      : <span className="selo ok">CA válido</span>}
                    {e.estoque <= 0 ? <span className="selo erro">Sem estoque</span>
                      : estoqueBaixo(e) ? <span className="selo aviso">Estoque baixo: {e.estoque}</span>
                      : <span className="selo neutro">{e.estoque} em estoque</span>}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <Folha aberta={novo} titulo="Novo EPI" onFechar={fechar}>
        <form onSubmit={salvar}>
          {erro && <div className="aviso-caixa erro" role="alert"><Icone nome="alerta" tamanho={20} />{erro}</div>}
          <label className="campo"><span>Nome do EPI</span>
            <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex.: Luva de raspa" required />
          </label>
          <div className="campos-2">
            <label className="campo"><span>Número do CA</span>
              <input inputMode="numeric" value={form.ca} onChange={(e) => setForm({ ...form, ca: e.target.value })} required />
            </label>
            <label className="campo"><span>Validade do CA</span>
              <input type="date" value={form.validadeCa} onChange={(e) => setForm({ ...form, validadeCa: e.target.value })} required />
            </label>
          </div>
          <label className="campo"><span>Lote</span>
            <input value={form.lote} onChange={(e) => setForm({ ...form, lote: e.target.value })} placeholder="Opcional" />
          </label>
          <div className="campos-2">
            <label className="campo"><span>Em estoque</span>
              <input inputMode="numeric" value={form.estoque} onChange={(e) => setForm({ ...form, estoque: e.target.value.replace(/\D/g, "") })} required />
            </label>
            <label className="campo"><span>Avisar quando restar</span>
              <input inputMode="numeric" value={form.estoqueMinimo} onChange={(e) => setForm({ ...form, estoqueMinimo: e.target.value.replace(/\D/g, "") })} placeholder="Ex.: 5" />
            </label>
          </div>
          <button className="botao" type="submit" disabled={salvando}>{salvando ? "Salvando…" : "Cadastrar EPI"}</button>
        </form>
      </Folha>
    </main>
  );
}
