// Gera favicon e ícones do app a partir do símbolo do sol (public/marca/sol-simbolo.png).
import sharp from "sharp";
import { writeFileSync } from "node:fs";

const simbolo = "public/marca/sol-simbolo.png";

// Fundo branco com cantos arredondados e o sol ocupando `escala` do lado.
async function icone(lado, { escala = 0.8, cantos = true } = {}) {
  const miolo = Math.round(lado * escala);
  const sol = await sharp(simbolo).resize(miolo, miolo, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const raio = cantos ? Math.round(lado * 0.22) : 0;
  const fundo = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}"><rect width="${lado}" height="${lado}" rx="${raio}" fill="#ffffff"/></svg>`,
  );
  return sharp(fundo).composite([{ input: sol, gravity: "center" }]).png().toBuffer();
}

writeFileSync("public/icons/icon-192.png", await icone(192));
writeFileSync("public/icons/icon-512.png", await icone(512));
writeFileSync("src/app/icon.png", await icone(512));
writeFileSync("src/app/apple-icon.png", await icone(180, { escala: 0.78, cantos: false }));
// "maskable": fundo cheio e sol menor, para caber na área segura do Android
writeFileSync("public/icons/icon-maskable-512.png", await icone(512, { escala: 0.6, cantos: false }));

// favicon.ico com PNGs embutidos (16, 32, 48); nos tamanhos pequenos o sol ocupa quase tudo
const tamanhos = [16, 32, 48];
const imagens = await Promise.all(tamanhos.map((t) => icone(t, { escala: 0.96, cantos: false })));
const cabecalho = Buffer.alloc(6);
cabecalho.writeUInt16LE(1, 2);
cabecalho.writeUInt16LE(tamanhos.length, 4);
let deslocamento = 6 + 16 * tamanhos.length;
const entradas = imagens.map((img, i) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(tamanhos[i], 0);
  e.writeUInt8(tamanhos[i], 1);
  e.writeUInt16LE(1, 4);
  e.writeUInt16LE(32, 6);
  e.writeUInt32LE(img.length, 8);
  e.writeUInt32LE(deslocamento, 12);
  deslocamento += img.length;
  return e;
});
writeFileSync("src/app/favicon.ico", Buffer.concat([cabecalho, ...entradas, ...imagens]));
console.log("ícones gerados");
