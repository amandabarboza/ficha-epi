"use client";

import { useEffect, useState } from "react";
import { cadastrarFuncionario, carregar } from "@/lib/dados";
import type { Funcionario } from "@/lib/tipos";

export default function Funcionarios() {
  const [lista, setLista] = useState<Funcionario[]>([]);
  const [novo, setNovo] = useState(false);
  const [erro, setErro] = useState("");
  const [form, setForm] = useState({ nome: "", matricula: "", funcao: "", pin: "" });

  useEffect(() => setLista(carregar().funcionarios), []);

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (!/^\d{4}$/.test(form.pin)) {
      setErro("O PIN precisa ter 4 números.");
      return;
    }
    try {
      cadastrarFuncionario({ ...form, nome: form.nome.trim() });
      setLista(carregar().funcionarios);
      setForm({ nome: "", matricula: "", funcao: "", pin: "" });
      setNovo(false);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível salvar.");
    }
  }

  return (
    <main className="pagina">
      <h1>Pessoas</h1>
      <p className="suave">Funcionários que podem receber EPI.</p>

      {novo ? (
        <form onSubmit={salvar} className="cartao">
          <h2>Novo funcionário</h2>
          {erro && <div className="aviso-caixa erro" role="alert">{erro}</div>}
          <label className="campo"><span>Nome completo</span>
            <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
          </label>
          <label className="campo"><span>Matrícula</span>
            <input inputMode="numeric" value={form.matricula} onChange={(e) => setForm({ ...form, matricula: e.target.value })} required />
          </label>
          <label className="campo"><span>Função</span>
            <input value={form.funcao} onChange={(e) => setForm({ ...form, funcao: e.target.value })} />
          </label>
          <label className="campo"><span>PIN de 4 números (o funcionário usa para confirmar)</span>
            <input inputMode="numeric" maxLength={4} type="password" value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value })} required />
          </label>
          <button className="botao" type="submit">Salvar</button>
          <button className="botao secundario" type="button" onClick={() => setNovo(false)}>Cancelar</button>
        </form>
      ) : (
        <button className="botao" style={{ marginBottom: 16 }} onClick={() => setNovo(true)}>+ Cadastrar funcionário</button>
      )}

      {lista.map((f) => (
        <div key={f.id} className="cartao">
          <strong>{f.nome}</strong>
          <div className="suave">Matrícula {f.matricula} · {f.funcao || "sem função"}</div>
        </div>
      ))}
    </main>
  );
}
