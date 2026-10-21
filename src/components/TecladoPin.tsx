"use client";

type Props = { valor: string; tamanho?: number; onMudar: (v: string) => void };

export function TecladoPin({ valor, tamanho = 4, onMudar }: Props) {
  const teclas = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];
  return (
    <div>
      <div className="pin-pontos" role="img" aria-label={`${valor.length} de ${tamanho} números digitados`}>
        {Array.from({ length: tamanho }, (_, i) => (
          <span key={i} className={i < valor.length ? "cheio" : ""} />
        ))}
      </div>
      <div className="teclado">
        {teclas.map((t, i) =>
          t === "" ? (
            <span key={i} />
          ) : (
            <button
              key={i}
              type="button"
              aria-label={t === "⌫" ? "Apagar" : t}
              onClick={() => onMudar(t === "⌫" ? valor.slice(0, -1) : (valor + t).slice(0, tamanho))}
            >
              {t}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
