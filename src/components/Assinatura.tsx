"use client";

import { useEffect, useRef, useState } from "react";

type Props = { onMudar: (png: string | null) => void };

export function Assinatura({ onMudar }: Props) {
  const tela = useRef<HTMLCanvasElement>(null);
  const desenhando = useRef(false);
  const [vazia, setVazia] = useState(true);

  useEffect(() => {
    const c = tela.current;
    if (!c) return;
    const razao = window.devicePixelRatio || 1;
    c.width = c.clientWidth * razao;
    c.height = c.clientHeight * razao;
    const ctx = c.getContext("2d")!;
    ctx.scale(razao, razao);
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111";
  }, []);

  function ponto(e: React.PointerEvent) {
    const r = tela.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function comecar(e: React.PointerEvent) {
    tela.current!.setPointerCapture(e.pointerId);
    desenhando.current = true;
    const ctx = tela.current!.getContext("2d")!;
    const { x, y } = ponto(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.01, y + 0.01);
    ctx.stroke();
  }

  function mover(e: React.PointerEvent) {
    if (!desenhando.current) return;
    const ctx = tela.current!.getContext("2d")!;
    const { x, y } = ponto(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function terminar() {
    if (!desenhando.current) return;
    desenhando.current = false;
    setVazia(false);
    onMudar(tela.current!.toDataURL("image/png"));
  }

  function limpar() {
    const c = tela.current!;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    setVazia(true);
    onMudar(null);
  }

  return (
    <div>
      <canvas
        ref={tela}
        className="assinatura"
        aria-label="Área para assinar com o dedo"
        onPointerDown={comecar}
        onPointerMove={mover}
        onPointerUp={terminar}
        onPointerCancel={terminar}
      />
      <button type="button" className="botao secundario" style={{ marginTop: 12 }} onClick={limpar} disabled={vazia}>
        Apagar e assinar de novo
      </button>
    </div>
  );
}
