// Gera os PNGs e o favicon.ico a partir de public/icons/icon.svg
import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";

const svg = readFileSync("public/icons/icon.svg");
const png = (size) => sharp(svg, { density: 384 }).resize(size, size).png().toBuffer();

writeFileSync("public/icons/icon-192.png", await png(192));
writeFileSync("public/icons/icon-512.png", await png(512));
writeFileSync("src/app/apple-icon.png", await png(180));

// Versão "maskable": fundo cheio, escudo menor para caber na área segura.
const maskable = await sharp({
  create: { width: 512, height: 512, channels: 4, background: "#F97316" },
})
  .composite([{ input: await sharp(svg, { density: 384 }).resize(340, 340).png().toBuffer(), gravity: "center" }])
  .png()
  .toBuffer();
writeFileSync("public/icons/icon-maskable-512.png", maskable);

// favicon.ico com PNGs embutidos (16, 32, 48)
const sizes = [16, 32, 48];
const images = await Promise.all(sizes.map(png));
const header = Buffer.alloc(6);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = 6 + 16 * sizes.length;
const entries = images.map((img, i) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(sizes[i], 0);
  e.writeUInt8(sizes[i], 1);
  e.writeUInt16LE(1, 4);
  e.writeUInt16LE(32, 6);
  e.writeUInt32LE(img.length, 8);
  e.writeUInt32LE(offset, 12);
  offset += img.length;
  return e;
});
writeFileSync("src/app/favicon.ico", Buffer.concat([header, ...entries, ...images]));
console.log("ícones gerados");
