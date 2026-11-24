// Compone el chip del logo VBR sobre las ilustraciones isométricas y exporta WebP
import sharp from "sharp";

const LOGO = "/home/z/my-project/upload/LOGOVBR (2).png"; // 392x85 fondo transparente
const NAVY = "#1A1A2E";

const names = [
  "experiencia",
  "creatividad",
  "tecnologia",
  "precision",
  "adaptabilidad",
  "compromiso",
];

// 1) Chip: rect navy redondeado + logo centrado
const CHIP_W = 440,
  CHIP_H = 120;
const logo = await sharp(LOGO).resize(392, 85).png().toBuffer();
const chipSvg = `<svg width="${CHIP_W}" height="${CHIP_H}"><rect width="${CHIP_W}" height="${CHIP_H}" rx="24" fill="${NAVY}"/></svg>`;
const chip = await sharp(Buffer.from(chipSvg))
  .composite([{ input: logo, left: 24, top: Math.round((CHIP_H - 85) / 2) }])
  .png()
  .toBuffer();

// 2) En cada imagen: chip escalado abajo-DERECHA (zona segura tras el crop de object-cover,
//    sin chocar con el icono superpuesto que va abajo-izquierda) + WebP 896px
const CHIP_FINAL_W = 320;
const CHIP_FINAL_H = Math.round((CHIP_FINAL_W / CHIP_W) * CHIP_H); // ~87
// Dimensiones DESPUÉS del resize (el composite se aplica sobre la imagen ya redimensionada)
const OUT_W = 896;
const OUT_H = 512;
const MARGIN_X = 32; // margen derecho
const MARGIN_BOTTOM = 64; // > ~54px que recorta object-cover en tarjetas h-44

for (const n of names) {
  const src = `/home/z/my-project/scripts/iso-${n}.png`;
  const out = `/home/z/my-project/public/features/iso-${n}.webp`;
  await sharp(src)
    .resize({ width: OUT_W })
    .composite([
      {
        input: await sharp(chip).resize(CHIP_FINAL_W).png().toBuffer(),
        left: OUT_W - MARGIN_X - CHIP_FINAL_W,
        top: OUT_H - MARGIN_BOTTOM - CHIP_FINAL_H,
      },
    ])
    .webp({ quality: 80, effort: 6 })
    .toFile(out);
  console.log("OK iso-" + n + ".webp");
}
