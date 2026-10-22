"use client";

import { useEffect, useRef } from "react";

// Ícones de traço (desenhos no estilo Lucide), herdam a cor do texto.
const ICONES = {
  busca: ["M21 21l-4.3-4.3", "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"],
  voltar: ["m15 18-6-6 6-6"],
  seta: ["m9 18 6-6-6-6"],
  mais: ["M5 12h14", "M12 5v14"],
  fechar: ["M18 6 6 18", "M6 6l12 12"],
  ok: ["M20 6 9 17l-5-5"],
  alerta: ["m21.7 18-8-14a2 2 0 0 0-3.5 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3", "M12 9v4", "M12 17h.01"],
  escudo: ["M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"],
  pessoas: ["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M22 21v-2a4 4 0 0 0-3-3.9", "M16 3.1a4 4 0 0 1 0 7.8"],
  ficha: ["M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z", "M14 2v4a2 2 0 0 0 2 2h4", "M16 13H8", "M16 17H8", "M10 9H8"],
  entrega: ["M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2", "M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z", "m9 14 2 2 4-4"],
  sair: ["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "m16 17 5-5-5-5", "M21 12H9"],
  imprimir: ["M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2", "M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6", "M7 14h10a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1z"],
  caixa: ["M11 21.7a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7z", "M12 22V12", "m3.3 7 8.7 5 8.7-5"],
  refazer: ["M3 12a9 9 0 1 0 9-9 9.8 9.8 0 0 0-6.7 2.7L3 8", "M3 3v5h5"],
  apagar: ["M10 5a2 2 0 0 0-1.3.5l-6.4 5.8a1 1 0 0 0 0 1.4l6.4 5.8A2 2 0 0 0 10 19h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z", "m12 9 6 6", "m18 9-6 6"],
  relogio: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z", "M12 6v6l4 2"],
} as const;

export type NomeIcone = keyof typeof ICONES;

export function Icone({ nome, tamanho = 24, className }: { nome: NomeIcone; tamanho?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONES[nome].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

export function iniciais(nome: string) {
  return nome.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

// Iniciais em formato de crachá
export function Avatar({ nome, grande = false }: { nome: string; grande?: boolean }) {
  return (
    <span className={grande ? "cracha cracha-grande" : "cracha"} aria-hidden="true">
      {iniciais(nome)}
    </span>
  );
}

// Número do CA em etiqueta, como selo carimbado no equipamento
export function EtiquetaCA({ ca, vencido = false }: { ca: string; vencido?: boolean }) {
  return (
    <span className={vencido ? "ca vencido" : "ca"} aria-label={`CA ${ca}`}>
      <small>CA</small>
      <b>{ca}</b>
    </span>
  );
}

export function Matricula({ valor }: { valor: string }) {
  return <span className="matricula">MAT {valor}</span>;
}

type CabecalhoProps = {
  rotulo?: string;
  titulo: string;
  subtitulo?: string;
  onVoltar?: () => void;
  acao?: React.ReactNode;
};

export function CabecalhoPagina({ rotulo, titulo, subtitulo, onVoltar, acao }: CabecalhoProps) {
  return (
    <div className="cab-pagina">
      {onVoltar && (
        <button type="button" className="botao-icone" onClick={onVoltar} aria-label="Voltar">
          <Icone nome="voltar" />
        </button>
      )}
      <div className="cab-pagina-textos">
        {rotulo && <span className="rotulo">{rotulo}</span>}
        <h1>{titulo}</h1>
        {subtitulo && <p>{subtitulo}</p>}
      </div>
      {acao}
    </div>
  );
}

export function Busca({ valor, onMudar, rotulo }: { valor: string; onMudar: (v: string) => void; rotulo: string }) {
  return (
    <label className="busca">
      <Icone nome="busca" tamanho={20} />
      <input type="search" value={valor} onChange={(e) => onMudar(e.target.value)} placeholder={rotulo} aria-label={rotulo} />
    </label>
  );
}

export function Vazio({ icone, titulo, texto }: { icone: NomeIcone; titulo: string; texto?: string }) {
  return (
    <div className="vazio">
      <span className="vazio-icone"><Icone nome={icone} tamanho={28} /></span>
      <strong>{titulo}</strong>
      {texto && <p>{texto}</p>}
    </div>
  );
}

// Painel que sobe de baixo, para formulários. Fecha no X, no fundo escuro ou com Esc.
export function Folha({ aberta, titulo, onFechar, children }: { aberta: boolean; titulo: string; onFechar: () => void; children: React.ReactNode }) {
  const painel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberta) return;
    const anterior = document.activeElement as HTMLElement | null;
    painel.current?.querySelector<HTMLElement>("input, select, button")?.focus();
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    document.addEventListener("keydown", tecla);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", tecla);
      document.body.style.overflow = "";
      anterior?.focus();
    };
  }, [aberta, onFechar]);

  if (!aberta) return null;
  return (
    <div className="folha-fundo" onClick={onFechar}>
      <div ref={painel} className="folha" role="dialog" aria-modal="true" aria-label={titulo} onClick={(e) => e.stopPropagation()}>
        <div className="folha-topo">
          <h2>{titulo}</h2>
          <button type="button" className="botao-icone" onClick={onFechar} aria-label="Fechar">
            <Icone nome="fechar" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
