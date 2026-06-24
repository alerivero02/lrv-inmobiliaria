import sharp from "../backend-node/node_modules/sharp/lib/index.js";
import { writeFile } from "fs/promises";

const images = [
  {
    url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1920&q=85",
    out: "public/images/services/casas.webp",
  },
  {
    url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1920&q=85",
    out: "public/images/services/departamentos.webp",
  },
  {
    url: "https://images.unsplash.com/photo-1464207687429-7505649dae38?w=1920&q=85",
    out: "public/images/services/terrenos.webp",
  },
  {
    url: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1920&q=85",
    out: "public/images/services/fincas.webp",
  },
  {
    url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=85",
    out: "public/images/brand/hero.webp",
  },
  {
    url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=85",
    out: "public/images/brand/og-cover.webp",
  },
  {
    url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=85",
    out: "public/images/contact/ambient.webp",
  },
];

for (const img of images) {
  const res = await fetch(img.url);
  if (!res.ok) throw new Error(`${img.out} ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const webp = await sharp(buf)
    .resize({ width: 1920, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
  await writeFile(img.out, webp);
  console.log("ok", img.out, webp.length);
}

const noise = await sharp({
  create: { width: 256, height: 256, channels: 3, background: { r: 240, g: 235, b: 227 } },
})
  .webp({ quality: 60 })
  .toBuffer();
await writeFile("public/images/textures/bone-noise.webp", noise);
console.log("ok texture");
