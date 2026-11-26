// Genera 6 fotografías deportivas profesionales (estilo natural, sin logos ni texto)
// para las tarjetas de "¿Por Qué Elegirnos?" — cada foto alineada al texto de su tarjeta
import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";

const STYLE =
  "Ultra realistic professional sports event photography, natural true-to-life colors, no filters, sharp focus, shallow depth of field, dynamic composition, shot on DSLR 70-200mm lens, natural daylight, no text, no words, no logos, no watermarks, high quality photojournalism";

const scenes = {
  experiencia: `${STYLE}: wide shot of a big city marathon finish line, large white finish arch over the road, an exhausted runner crossing the line raising both arms in triumph, cheering crowd behind metal barriers, volunteers in red vests, bright morning sunlight, lively organized atmosphere`,
  creatividad: `${STYLE}: explosive start-line celebration of a city race at sunrise, red and multicolor confetti cannons firing over thousands of runners, red balloons, energetic festive atmosphere, runners smiling with arms up, low dramatic angle from within the crowd`,
  tecnologia: `${STYLE}: race timing station at a Latin American marathon finish line, large black LED race clock display showing simple digits, Hispanic timing official wearing a red polo shirt checking live results on a laptop on a folding table beside the finish chute, black equipment flight cases, plain blank white banners with no writing at all, late afternoon warm golden light, professional setup, absolutely no Chinese characters, no Asian writing, only simple digits on the clock`,
  precision: `${STYLE}: close view of a race finish area on asphalt, bright red timing mat strip across the road, photo-finish camera mounted on a tripod aligned with the finish line, neat rows of orange cones and barricades, an official with clipboard, crisp clear morning light`,
  adaptabilidad: `${STYLE}: triathlete in black wetsuit running out of open water, splashing water around the legs, running toward a transition zone with rows of bicycles on racks, red transition arch, beach and morning sun, sense of multi-sport action`,
  compromiso: `${STYLE}: emotional finish area moment, a smiling volunteer in a red vest placing a finisher medal over the head of an exhausted runner wrapped in a foil blanket, genuine happiness, blurred cheering crowd in the background, warm natural daylight`,
};

const names = Object.keys(scenes);
const zai = await ZAI.create();

for (const n of names) {
  const out = `/home/z/my-project/scripts/foto-${n}.png`;
  if (fs.existsSync(out) && process.argv[2] !== "force") {
    console.log(`SKIP ${n} (ya existe)`);
    continue;
  }
  let done = false;
  for (let attempt = 1; attempt <= 2 && !done; attempt++) {
    try {
      const response = await zai.images.generations.create({
        prompt: scenes[n],
        size: "1344x768",
      });
      if (!response?.data?.[0]?.base64) throw new Error("sin imagen");
      const buffer = Buffer.from(response.data[0].base64, "base64");
      fs.writeFileSync(out, buffer);
      console.log(`OK ${out} ${(buffer.length / 1024).toFixed(0)} KB`);
      done = true;
    } catch (e) {
      console.error(`FALLO ${n} intento ${attempt}: ${e.message}`);
      if (attempt === 2) process.exitCode = 1;
    }
  }
}
