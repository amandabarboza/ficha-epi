"use client";

import { Icone } from "./ui";

type Props = { valor: string; tamanho?: number; errado?: boolean; onMudar: (v: string) => void };

export function TecladoPin({ valor, tamanho = 4, errado = false, onMudar }: Props) {
  const teclas = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "apagar"];
  return (
    <div>
      <div className={errado ? "pin-pontos errado" : "pin-pontos"} role="img" aria-label={`${valor.length} de ${tamanho} números digitados`}>
        {Array.from({ length: tamanho }, (_, i) => (
          <span key={i} className={i < valor.length ? "cheio" : ""} />
        ))}
      </div>
      <div className="teclado">
        {teclas.map((t, i) =>
          t === "" ? (
            <span key={i} />
          ) : t === "apagar" ? (
            <button key={i} type="button" className="tecla-leve" aria-label="Apagar" onClick={() => onMudar(valor.slice(0, -1))}>
              <Icone nome="apagar" tamanho={28} />
            </button>
          ) : (
            <button key={i} type="button" aria-label={t} onClick={() => onMudar((valor + t).slice(0, tamanho))}>
              {t}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
