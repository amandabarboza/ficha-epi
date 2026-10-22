// Ilustrações dos atalhos da tela inicial: traço petróleo com preenchimentos suaves.
const P = "#1a3a3a"; // traço
const A = "#f8a80c"; // amarelo SOL
const AC = "#ffe3a3"; // amarelo claro
const V = "#cfe6e3"; // verde-água claro
const PELE = "#f5c9a3";
const OK = "#34a668";
const ERRO = "#ef6a5a";

const traco = { stroke: P, strokeWidth: 2.4, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

const DESENHOS = {
  entrega: (
    <>
      <rect x="14" y="10" width="34" height="44" rx="5" fill="#fff" {...traco} />
      <rect x="23" y="6" width="16" height="9" rx="3" fill={V} {...traco} />
      <path d="M21 26h14M21 33h10" {...traco} fill="none" />
      <circle cx="44" cy="44" r="12" fill={OK} {...traco} />
      <path d="m38.5 44 4 4 7-8" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  pessoas: (
    <>
      <path d="M12 58c0-11 8.5-17 20-17s20 6 20 17z" fill={V} {...traco} />
      <path d="M27 41v6l5 4 5-4v-6" fill="#fff" {...traco} />
      <circle cx="32" cy="30" r="10" fill={PELE} {...traco} />
      <path d="M19 26c0-9 6-14 13-14s13 5 13 14z" fill={A} {...traco} />
      <path d="M16 26h32" {...traco} />
      <path d="M32 12v8" {...traco} />
      <circle cx="28.5" cy="31" r="1.3" fill={P} />
      <circle cx="35.5" cy="31" r="1.3" fill={P} />
    </>
  ),
  epis: (
    <>
      <path d="M10 40c0-15 9.5-24 22-24s22 9 22 24z" fill={A} {...traco} />
      <rect x="6" y="39" width="52" height="8" rx="4" fill={AC} {...traco} />
      <path d="M32 16v23M22 21c-3 5-4 11-4 18M42 21c3 5 4 11 4 18" {...traco} fill="none" />
      <rect x="18" y="50" width="28" height="9" rx="4.5" fill={V} {...traco} />
      <circle cx="26" cy="54.5" r="2" fill="#fff" stroke={P} strokeWidth="1.6" />
      <circle cx="38" cy="54.5" r="2" fill="#fff" stroke={P} strokeWidth="1.6" />
    </>
  ),
  fichas: (
    <>
      <path d="M14 8h24l12 12v36a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3V11a3 3 0 0 1 3-3z" fill="#fff" {...traco} />
      <path d="M38 8v12h12" fill={V} {...traco} />
      <path d="M18 28h22M18 35h22M18 42h14" {...traco} fill="none" />
      <path d="M36 54c3-4 5-6 8-6s2 4 6 1" stroke={A} strokeWidth="2.6" fill="none" strokeLinecap="round" />
    </>
  ),
  alertas: (
    <>
      <path d="M28.5 9.5a4 4 0 0 1 7 0l22 38A4 4 0 0 1 54 53.5H10a4 4 0 0 1-3.5-6z" fill={A} {...traco} />
      <path d="M32 24v14" stroke={P} strokeWidth="4" strokeLinecap="round" />
      <circle cx="32" cy="45" r="2.6" fill={P} />
      <circle cx="51" cy="13" r="7" fill={ERRO} {...traco} />
    </>
  ),
  estoque: (
    <>
      <path d="M8 34h22v22H8z" fill={AC} {...traco} />
      <path d="M34 34h22v22H34z" fill={AC} {...traco} />
      <path d="M21 12h22v22H21z" fill={A} {...traco} />
      <path d="M16 34v7h6v-7M42 34v7h6v-7M29 12v7h6v-7" fill="#fff" {...traco} />
    </>
  ),
} as const;

export type NomeIlustracao = keyof typeof DESENHOS;

export function Ilustracao({ nome, tamanho = 56 }: { nome: NomeIlustracao; tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 64 64" aria-hidden="true">
      {DESENHOS[nome]}
    </svg>
  );
}
