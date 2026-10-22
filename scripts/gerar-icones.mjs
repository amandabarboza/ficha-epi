// Gera favicon e ícones do app a partir dos desenhos vetoriais em public/icons.
//   icone.svg          → ícone completo (app, tela inicial)
//   icone-pequeno.svg  → versão simplificada para 16 e 32 px
import sharp from "sharp";
import { copyFileSync, readFileSync, writeFileSync } from "node:fs";

const completo = readFileSync("public/icons/icone.svg", "utf8");
const pequeno = readFileSync("public/icons/icone-pequeno.svg", "utf8");
// Sem cantos arredondados: iOS e Android aplicam a máscara deles
const quadrado = completo.replace(/rx="\d+"/, 'rx="0"');

const png = (svg, lado) => sharp(Buffer.from(svg), { density: 400 }).resize(lado, lado).png().toBuffer();

writeFileSync("public/icons/icon-192.png", await png(completo, 192));
writeFileSync("public/icons/icon-512.png", await png(completo, 512));
writeFileSync("src/app/apple-icon.png", await png(quadrado, 180));
copyFileSync("public/icons/icone.svg", "src/app/icon.svg");

// "maskable": desenho reduzido dentro da área segura, fundo petróleo cheio
const miolo = await png(quadrado, 400);
writeFileSync(
  "public/icons/icon-maskable-512.png",
  await sharp({ create: { width: 512, height: 512, channels: 4, background: "#1a3a3a" } })
    .composite([{ input: miolo, gravity: "center" }])
    .png()
    .toBuffer(),
);

// favicon.ico com PNGs embutidos (16, 32, 48)
const tamanhos = [16, 32, 48];
const imagens = await Promise.all(tamanhos.map((t) => png(t <= 32 ? pequeno : completo, t)));
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
