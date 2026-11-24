// Genera imagen héroe multi-disciplina 2560x1440 con el SDK directamente
import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";

const prompt = `Epic panoramic sports banner collage, four endurance disciplines in one dynamic wide scene: professional road cyclist in red jersey sprinting low on wet asphalt mountain road at far left, marathon runner mid-stride racing on city street at center, triathlete in black wetsuit running out of splashing open water at center-left, hiker with backpack and trekking poles climbing an Andean mountain trail at far right, dramatic golden hour backlight with sun flare, Venezuelan Andes mountains and city skyline in the far background, sense of speed and motion, sharp focus, ultra detailed professional sports photography, cinematic dark moody edges ideal for white text overlay, red accent tones, high quality, crisp`;

const size = process.argv[2] || "2560x1440";
const out = process.argv[3] || "/home/z/my-project/scripts/hero-a.png";

const zai = await ZAI.create();
const response = await zai.images.generations.create({ prompt, size });

if (!response?.data?.[0]?.base64) {
  console.error("Respuesta sin imagen");
  process.exit(1);
}
const buffer = Buffer.from(response.data[0].base64, "base64");
fs.writeFileSync(out, buffer);
console.log(`OK ${out} ${(buffer.length / 1024).toFixed(0)} KB`);
