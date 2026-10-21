"use client";

import { useEffect, useState } from "react";
import { caVencido, diasParaVencer, repo } from "@/lib/dados";
import type { Epi } from "@/lib/tipos";

export default function Epis() {
  const [lista, setLista] = useState<Epi[]>([]);
  const [novo, setNovo] = useState(false);
  const [form, setForm] = useState({ nome: "", ca: "", validadeCa: "", lote: "", estoque: "", estoqueMinimo: "" });

  const [erro, setErro] = useState("");

  function recarregar() {
    repo.listar().then((b) => setLista(b.epis)).catch((e: Error) => setErro(e.message));
  }
  useEffect(recarregar, []);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
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
      setForm({ nome: "", ca: "", validadeCa: "", lote: "", estoque: "", estoqueMinimo: "" });
      setNovo(false);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível salvar.");
    }
  }

  const alertas = lista.filter((e) => caVencido(e) || diasParaVencer(e) <= 30 || e.estoque <= e.estoqueMinimo);

  return (
    <main className="pagina">
      <h1>EPIs</h1>
      <p className="suave">Catálogo com CA e estoque.</p>

      {alertas.length > 0 && (
        <div className="aviso-caixa aviso" role="status">
          {alertas.length} {alertas.length === 1 ? "item precisa" : "itens precisam"} de atenção (CA vencendo ou estoque baixo).
        </div>
      )}

      {novo ? (
        <form onSubmit={salvar} className="cartao">
          <h2>Novo EPI</h2>
          {erro && <div className="aviso-caixa erro" role="alert">{erro}</div>}
          <label className="campo"><span>Nome</span><input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required /></label>
          <label className="campo"><span>Número do CA</span><input inputMode="numeric" value={form.ca} onChange={(e) => setForm({ ...form, ca: e.target.value })} required /></label>
          <label className="campo"><span>Validade do CA</span><input type="date" value={form.validadeCa} onChange={(e) => setForm({ ...form, validadeCa: e.target.value })} required /></label>
          <label className="campo"><span>Lote</span><input value={form.lote} onChange={(e) => setForm({ ...form, lote: e.target.value })} /></label>
          <label className="campo"><span>Quantidade em estoque</span><input inputMode="numeric" value={form.estoque} onChange={(e) => setForm({ ...form, estoque: e.target.value })} required /></label>
          <label className="campo"><span>Avisar quando restar até</span><input inputMode="numeric" value={form.estoqueMinimo} onChange={(e) => setForm({ ...form, estoqueMinimo: e.target.value })} /></label>
          <button className="botao" type="submit">Salvar</button>
          <button className="botao secundario" type="button" onClick={() => setNovo(false)}>Cancelar</button>
        </form>
      ) : (
        <button className="botao" style={{ marginBottom: 16 }} onClick={() => setNovo(true)}>+ Cadastrar EPI</button>
      )}

      {lista.map((e) => {
        const dias = diasParaVencer(e);
        return (
          <div key={e.id} className="cartao">
            <strong>{e.nome}</strong>
            <div className="suave">CA {e.ca} · lote {e.lote || "—"}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
              {caVencido(e) ? <span className="selo erro">CA vencido</span>
                : dias <= 30 ? <span className="selo aviso">CA vence em {dias} dias</span>
                : <span className="selo ok">CA válido</span>}
              {e.estoque <= e.estoqueMinimo
                ? <span className="selo aviso">Estoque baixo: {e.estoque}</span>
                : <span className="selo ok">{e.estoque} em estoque</span>}
            </div>
          </div>
        );
      })}
    </main>
  );
}
