"use client";

import { useEffect, useMemo, useState } from "react";
import { Assinatura } from "@/components/Assinatura";
import { TecladoPin } from "@/components/TecladoPin";
import { carregar, caVencido, registrarEntrega } from "@/lib/dados";
import { lerSessao } from "@/lib/sessao";
import type { Entrega, Epi, Funcionario } from "@/lib/tipos";

type Passo = "pessoa" | "epi" | "pin" | "assinar" | "pronto";
const ORDEM: Passo[] = ["pessoa", "epi", "pin", "assinar", "pronto"];

function iniciais(nome: string) {
  return nome.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

export default function Retirada() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [epis, setEpis] = useState<Epi[]>([]);
  const [passo, setPasso] = useState<Passo>("pessoa");
  const [busca, setBusca] = useState("");
  const [pessoa, setPessoa] = useState<Funcionario | null>(null);
  const [epi, setEpi] = useState<Epi | null>(null);
  const [pin, setPin] = useState("");
  const [erro, setErro] = useState("");
  const [assinatura, setAssinatura] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [recibo, setRecibo] = useState<Entrega | null>(null);

  function recarregar() {
    const b = carregar();
    setFuncionarios(b.funcionarios);
    setEpis(b.epis);
  }
  useEffect(recarregar, []);

  const filtrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    if (!t) return funcionarios;
    return funcionarios.filter((f) => f.nome.toLowerCase().includes(t) || f.matricula.includes(t));
  }, [busca, funcionarios]);

  function recomecar() {
    setPasso("pessoa");
    setPessoa(null);
    setEpi(null);
    setPin("");
    setErro("");
    setAssinatura(null);
    setRecibo(null);
    setBusca("");
    recarregar();
  }

  function confirmarPin(valor: string) {
    setPin(valor);
    setErro("");
    if (valor.length < 4 || !pessoa) return;
    if (valor === pessoa.pin) {
      setPasso("assinar");
    } else {
      setErro("PIN incorreto. Tente de novo.");
      setTimeout(() => setPin(""), 400);
    }
  }

  async function concluir() {
    if (!pessoa || !epi || !assinatura) return;
    setSalvando(true);
    setErro("");
    try {
      const r = await registrarEntrega({
        funcionarioId: pessoa.id,
        epiId: epi.id,
        tipo: "entrega",
        quantidade: 1,
        assinatura,
        almoxarife: lerSessao() ?? "Almoxarife",
      });
      setRecibo(r);
      setPasso("pronto");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível registrar.");
    } finally {
      setSalvando(false);
    }
  }

  const indice = ORDEM.indexOf(passo);

  return (
    <main className="pagina">
      <div className="passos" aria-hidden="true">
        {ORDEM.slice(0, 4).map((p, i) => (
          <i key={p} className={i <= indice ? "feito" : ""} />
        ))}
      </div>

      {passo === "pessoa" && (
        <section>
          <h1>Quem vai receber?</h1>
          <p className="suave">Toque no nome do funcionário.</p>
          <label className="campo">
            <span className="suave">Buscar por nome ou matrícula</span>
            <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Digite aqui" />
          </label>
          {filtrados.length === 0 && <p className="suave">Ninguém encontrado. Cadastre na aba Pessoas.</p>}
          {filtrados.map((f) => (
            <button key={f.id} className="cartao-botao" onClick={() => { setPessoa(f); setPasso("epi"); }}>
              <span className="avatar">{iniciais(f.nome)}</span>
              <span>
                <span className="titulo">{f.nome}</span>
                <span className="detalhe">Matrícula {f.matricula} · {f.funcao}</span>
              </span>
            </button>
          ))}
        </section>
      )}

      {passo === "epi" && pessoa && (
        <section>
          <h1>Qual EPI?</h1>
          <p className="suave">Para {pessoa.nome}</p>
          {epis.map((e) => {
            const vencido = caVencido(e);
            const semEstoque = e.estoque <= 0;
            const bloqueado = vencido || semEstoque;
            return (
              <button key={e.id} className="cartao-botao" disabled={bloqueado} onClick={() => { setEpi(e); setPasso("pin"); }}>
                <span style={{ flex: 1 }}>
                  <span className="titulo">{e.nome}</span>
                  <span className="detalhe">CA {e.ca} · {e.estoque} em estoque</span>
                </span>
                {vencido && <span className="selo erro">CA vencido</span>}
                {!vencido && semEstoque && <span className="selo erro">Sem estoque</span>}
              </button>
            );
          })}
          <button className="botao secundario" onClick={recomecar}>Voltar</button>
        </section>
      )}

      {passo === "pin" && pessoa && epi && (
        <section>
          <h1>{pessoa.nome.split(" ")[0]}, digite seu PIN</h1>
          <p className="suave">Recebendo: {epi.nome}</p>
          {erro && <div className="aviso-caixa erro" role="alert">{erro}</div>}
          <TecladoPin valor={pin} onMudar={confirmarPin} />
          <button className="botao secundario" style={{ marginTop: 24 }} onClick={() => { setPin(""); setPasso("epi"); }}>Voltar</button>
        </section>
      )}

      {passo === "assinar" && pessoa && epi && (
        <section>
          <h1>Assine aqui</h1>
          <p className="suave">Declaro que recebi {epi.nome} (CA {epi.ca}).</p>
          {erro && <div className="aviso-caixa erro" role="alert">{erro}</div>}
          <Assinatura onMudar={setAssinatura} />
          <button className="botao" style={{ marginTop: 16 }} disabled={!assinatura || salvando} onClick={concluir}>
            {salvando ? "Salvando…" : "Confirmar entrega"}
          </button>
        </section>
      )}

      {passo === "pronto" && recibo && pessoa && (
        <section className="sucesso" aria-live="polite">
          <div className="grande" aria-hidden="true">✓</div>
          <h1>Entrega registrada</h1>
          <p>{recibo.epiNome} entregue para {pessoa.nome}.</p>
          <p className="suave">{new Date(recibo.criadoEm).toLocaleString("pt-BR")}</p>
          <button className="botao" onClick={recomecar}>Nova entrega</button>
        </section>
      )}
    </main>
  );
}
