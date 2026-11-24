// Genera 6 ilustraciones isométricas planas estilo ChronoTrack con identidad VzlaBike & Run
// Estilo: fondo blanco, estructuras navy #1A1A2E, acentos rojo #DC2626, vector limpio
import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";

const STYLE =
  "Flat isometric vector illustration, clean pure white background, professional race timing infographic style like a modern SaaS website hero artwork, dark navy blue structural elements, vivid red accent details, crisp thin geometric shapes, tiny simplified flat human figures with simple poses, soft light-gray flat ground shadows, generous negative space, minimal muted palette with red highlights, sharp clean 2D vector art, no photographic textures, no noise, high detail";

const scenes = {
  experiencia: `${STYLE}, race start and finish scene: two large navy gantry arches labeled START and FINISH standing over a gray road lane, red timing mat strips on the road under each arch, a tiny runner and a tiny road cyclist passing under the arches, small navy registration desk with laptop and two staff figures, one floating results dashboard screen panel with simple chart, wide balanced composition`,
  creatividad: `${STYLE}, festive event celebration scene: navy finish arch decorated with red balloons and bunting flags, confetti pieces in red and gray falling, small stage platform with speakers and lights, crowd of tiny flat people cheering and taking photos, blank white banner panels on the arch, joyful event village atmosphere, wide balanced composition`,
  tecnologia: `${STYLE}, timing control center scene: navy server racks with red status LEDs, open laptop showing a live leaderboard chart, large LED race clock display on a tripod, red RFID timing antenna mat connected with cables, two floating analytics dashboard screens with charts and tables, one technician figure with headset, wide balanced composition`,
  precision: `${STYLE}, aerial isometric race course layout: long straight road lane divided into neat sections with rows of small cones, barricades and fence lines, red timing mats at split points, hydration table with bottles, photo-finish camera on tripod at the finish line, measuring staff figure with clipboard, precise orderly geometric composition, wide balanced layout`,
  adaptabilidad: `${STYLE}, triathlon circuit scene: small open water zone with two tiny swimmers and red buoys, transition zone with bike racks and two cyclists, running loop lane with red timing mat, connected by subtle dotted guide arrows, navy tent structure, one arch labeled FINISH at the end, three disciplines arranged left to right, wide balanced composition`,
  compromiso: `Flat isometric vector illustration with absolutely no words, no text, no letters, no titles, no labels, no captions, clean pure white background, dark navy blue and vivid red palette, crisp thin geometric shapes, tiny flat human figures, soft light-gray flat ground shadows, generous negative space, sharp clean 2D vector art: awards ceremony scene with a three-step navy winners podium and small flat athletes standing on it wearing gold medals around their necks, one official figure handing a medal ribbon to an athlete, a hydration station table with rows of small water bottles, a small navy canopy tent with a red first aid cross flag beside it, two tiny people cheering with raised arms at the sides, red medal ribbon details, warm supportive atmosphere, wide balanced composition`,
};

const names = Object.keys(scenes);
const zai = await ZAI.create();

for (const n of names) {
  const out = `/home/z/my-project/scripts/vbr-${n}.png`;
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
