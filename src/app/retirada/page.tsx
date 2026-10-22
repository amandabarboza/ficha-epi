"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Assinatura } from "@/components/Assinatura";
import { TecladoPin } from "@/components/TecladoPin";
import { Avatar, Busca, CabecalhoPagina, Icone, Vazio } from "@/components/ui";
import { caVencido, repo } from "@/lib/dados";
import { lerSessao } from "@/lib/sessao";
import type { Entrega, Epi, Funcionario } from "@/lib/tipos";

type Passo = "pessoa" | "epi" | "pin" | "assinar" | "pronto";
const ETAPAS: { passo: Passo; rotulo: string }[] = [
  { passo: "pessoa", rotulo: "Pessoa" },
  { passo: "epi", rotulo: "EPI" },
  { passo: "pin", rotulo: "PIN" },
  { passo: "assinar", rotulo: "Assinar" },
];
const ORDEM: Passo[] = ["pessoa", "epi", "pin", "assinar", "pronto"];

// Itens que não podem ser entregues ficam no fim da lista, com o motivo.
function motivoBloqueio(e: Epi): string | null {
  if (caVencido(e)) return `CA vencido em ${new Date(e.validadeCa + "T00:00").toLocaleDateString("pt-BR")}`;
  if (e.estoque <= 0) return "Sem estoque";
  return null;
}

export default function Retirada() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [epis, setEpis] = useState<Epi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [passo, setPasso] = useState<Passo>("pessoa");
  const [busca, setBusca] = useState("");
  const [pessoa, setPessoa] = useState<Funcionario | null>(null);
  const [epi, setEpi] = useState<Epi | null>(null);
  const [pin, setPin] = useState("");
  const [pinErrado, setPinErrado] = useState(false);
  const [erro, setErro] = useState("");
  const [assinatura, setAssinatura] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [recibo, setRecibo] = useState<Entrega | null>(null);

  function recarregar() {
    repo.listar()
      .then((b) => {
        setFuncionarios(b.funcionarios);
        setEpis(b.epis);
      })
      .catch((e: Error) => setErro(e.message))
      .finally(() => setCarregando(false));
  }
  useEffect(recarregar, []);

  const filtrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    if (!t) return funcionarios;
    return funcionarios.filter((f) => f.nome.toLowerCase().includes(t) || f.matricula.includes(t));
  }, [busca, funcionarios]);

  const episOrdenados = useMemo(
    () => [...epis].sort((a, b) => Number(!!motivoBloqueio(a)) - Number(!!motivoBloqueio(b)) || a.nome.localeCompare(b.nome)),
    [epis],
  );

  function irPara(p: Passo) {
    setErro("");
    setPin("");
    setPasso(p);
    window.scrollTo({ top: 0 });
  }

  function recomecar() {
    setPessoa(null);
    setEpi(null);
    setAssinatura(null);
    setRecibo(null);
    setBusca("");
    irPara("pessoa");
    recarregar();
  }

  async function confirmarPin(valor: string) {
    setPin(valor);
    setErro("");
    setPinErrado(false);
    if (valor.length < 4 || !pessoa) return;
    try {
      if (await repo.verificarPin(pessoa.id, valor)) {
        irPara("assinar");
        return;
      }
      setErro("PIN incorreto. Tente de novo.");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível conferir o PIN.");
    }
    setPinErrado(true);
    setTimeout(() => setPin(""), 350);
  }

  async function concluir() {
    if (!pessoa || !epi || !assinatura) return;
    setSalvando(true);
    setErro("");
    try {
      const r = await repo.registrarEntrega({
        funcionarioId: pessoa.id,
        epiId: epi.id,
        tipo: "entrega",
        quantidade: 1,
        assinatura,
        almoxarife: lerSessao() ?? "Almoxarife",
      });
      setRecibo(r);
      irPara("pronto");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível registrar.");
    } finally {
      setSalvando(false);
    }
  }

  const indice = ORDEM.indexOf(passo);
  const primeiroNome = pessoa?.nome.split(" ")[0] ?? "";

  return (
    <main className="pagina">
      {passo !== "pronto" && (
        <ol className="etapas" aria-label={`Passo ${indice + 1} de 4`}>
          {ETAPAS.map((e, i) => (
            <li key={e.passo} className={i < indice ? "feita" : i === indice ? "atual" : ""} aria-current={i === indice ? "step" : undefined}>
              {e.rotulo}
            </li>
          ))}
        </ol>
      )}

      {erro && passo !== "pin" && (
        <div className="aviso-caixa erro" role="alert">
          <Icone nome="alerta" tamanho={20} />
          {erro}
        </div>
      )}

      {passo === "pessoa" && (
        <section>
          <CabecalhoPagina titulo="Quem vai receber?" subtitulo="Toque no nome do funcionário." />
          <Busca valor={busca} onMudar={setBusca} rotulo="Buscar por nome ou matrícula" />
          {!carregando && filtrados.length === 0 ? (
            <Vazio
              icone="pessoas"
              titulo={busca ? "Ninguém encontrado" : "Nenhum funcionário cadastrado"}
              texto={busca ? "Confira o nome ou a matrícula." : "Cadastre na aba Pessoas."}
            />
          ) : (
            <ul className="lista">
              {filtrados.map((f) => (
                <li key={f.id}>
                  <button className="item" onClick={() => { setPessoa(f); irPara("epi"); }}>
                    <Avatar nome={f.nome} />
                    <span className="item-textos">
                      <span className="item-titulo">{f.nome}</span>
                      <span className="item-detalhe">Matrícula {f.matricula}{f.funcao && ` · ${f.funcao}`}</span>
                    </span>
                    <Icone nome="seta" className="item-seta" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {passo === "epi" && pessoa && (
        <section>
          <CabecalhoPagina titulo="Qual EPI?" onVoltar={() => irPara("pessoa")} />
          <div className="escolha">
            <Avatar nome={pessoa.nome} />
            <span className="item-textos">
              <span className="item-titulo">{pessoa.nome}</span>
              <span className="item-detalhe">{pessoa.funcao || `Matrícula ${pessoa.matricula}`}</span>
            </span>
            <button className="link-trocar" onClick={() => irPara("pessoa")}>Trocar</button>
          </div>
          <ul className="lista">
            {episOrdenados.map((e) => {
              const motivo = motivoBloqueio(e);
              return (
                <li key={e.id}>
                  <button className="item" disabled={!!motivo} onClick={() => { setEpi(e); irPara("pin"); }}>
                    <span className="item-icone"><Icone nome="escudo" /></span>
                    <span className="item-textos">
                      <span className="item-titulo">{e.nome}</span>
                      <span className="item-detalhe">CA {e.ca} · {e.estoque} em estoque</span>
                      {motivo && <span className="item-motivo"><Icone nome="alerta" tamanho={15} />{motivo}</span>}
                    </span>
                    {!motivo && <Icone nome="seta" className="item-seta" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {passo === "pin" && pessoa && epi && (
        <section className="pin">
          <div className="pin-topo">
            <button type="button" className="botao-icone" onClick={() => irPara("epi")} aria-label="Voltar">
              <Icone nome="voltar" />
            </button>
            <Avatar nome={pessoa.nome} grande />
          </div>
          <h1>{primeiroNome}, digite seu PIN</h1>
          <p className="suave">Para confirmar: {epi.nome}</p>
          <p className="pin-erro" role="alert">{erro}</p>
          <TecladoPin valor={pin} errado={pinErrado} onMudar={confirmarPin} />
        </section>
      )}

      {passo === "assinar" && pessoa && epi && (
        <section>
          <CabecalhoPagina titulo="Assinatura" subtitulo={`Entregue o celular para ${primeiroNome}.`} onVoltar={() => irPara("epi")} />
          <p className="declaracao">
            Eu, <strong>{pessoa.nome}</strong>, recebi <strong>1 {epi.nome}</strong> (CA {epi.ca}) e fui orientado sobre o uso correto.
          </p>
          <Assinatura onMudar={setAssinatura} />
          <button className="botao" disabled={!assinatura || salvando} onClick={concluir}>
            {salvando ? "Salvando…" : <><Icone nome="ok" /> Confirmar entrega</>}
          </button>
        </section>
      )}

      {passo === "pronto" && recibo && pessoa && (
        <section className="sucesso" aria-live="polite">
          <div className="sucesso-icone" aria-hidden="true"><Icone nome="ok" tamanho={52} /></div>
          <h1>Entrega registrada</h1>
          <p className="suave" style={{ marginTop: 6 }}>O registro está salvo e não pode ser alterado.</p>
          <dl className="recibo">
            <div><dt>Funcionário</dt><dd>{pessoa.nome}</dd></div>
            <div><dt>EPI</dt><dd>{recibo.epiNome}</dd></div>
            <div><dt>CA</dt><dd>{recibo.ca}</dd></div>
            <div><dt>Data e hora</dt><dd>{new Date(recibo.criadoEm).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</dd></div>
          </dl>
          <button className="botao" onClick={recomecar}>
            <Icone nome="mais" /> Nova entrega
          </button>
          <Link className="botao secundario" href={`/ficha?f=${pessoa.id}`} style={{ textDecoration: "none", marginTop: 10 }}>
            <Icone nome="ficha" /> Ver ficha de {primeiroNome}
          </Link>
        </section>
      )}
    </main>
  );
}
