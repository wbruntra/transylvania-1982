#!/usr/bin/env bun
// Builds The Quest's cartoon scene-art prompt manifest.
//
//   bun the-quest/tools/art-prompts.mjs              # write the-quest/art-prompts.json
//   bun the-quest/tools/art-prompts.mjs --picture 2  # print one prompt and exit
//
// The first eight of these were generated ad hoc and their prompts survived
// only in the image-gen gallery database, which meant re-running one was a
// re-derivation rather than a re-run. They are recovered here so that stops
// being true.
//
// The structure is the point. Every prompt is STYLE + scene + light + CLOSING,
// with STYLE and CLOSING repeated verbatim -- that repetition is what makes
// separately generated images read as one set. Light is its own field rather
// than a sentence buried in the scene text, because that is exactly the mistake
// the first pass made: three outdoor scenes each said "warm orange sunset sky"
// somewhere in the middle of their description, so when the decoded Apple II
// art turned out to have a bright blue midday sky, changing it meant finding
// and rewriting three separate sentences instead of editing one constant.

import { writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const questRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Generated with provider "openai", model "gpt-image-2.5-flare", 1536x1024.
export const MODEL = { provider: "openai", model: "gpt-image-2.5-flare", size: "1536x1024" };

// The style contract, repeated verbatim in every prompt.
const STYLE = [
  "1990s Sierra On-Line cartoon adventure game background art, in the style of",
  "King's Quest VII (1994) and Torin's Passage -- hand-painted cel-shaded",
  "animated-cartoon look, bold clean outlines,",
].join(" ");

// Peopled scenes ask for cartoon proportions as well; landscapes must not, or
// the model starts putting figures in empty countryside.
const FIGURES = "exaggerated whimsical character proportions,";
const COLOUR = "bright flat saturated colors with soft painterly shading.";

const CLOSING = {
  landscape: [
    "Vivid saturated storybook color palette, thick clean linework,",
    "flat cel-shaded cartoon rendering, no text, no watermark.",
  ].join(" "),
  peopled: [
    "Thick clean linework, flat cel-shaded cartoon rendering,",
    "storybook fantasy illustration, no text, no watermark.",
  ].join(" "),
};

// The one clause the three roadside scenes share. The original Apple II art for
// all three is a flat band of solid HCOLOR 6 blue across the top of the frame:
// this game's outdoors is broad daylight, not dusk.
const DAYLIGHT = [
  "Bright midday sky of deep saturated blue with a few soft white cartoon clouds,",
  "clear high sunlight, no sunset colours anywhere in the sky.",
].join(" ");

// Keyed by picture number, which is how the art files are named. `rooms` is
// filled in from the game data at build time -- several rooms share a picture.
const SCENES = {
  2: {
    scene: [
      "A dirt crossroads intersection out in open rolling countryside, with roads",
      "leading off to the north, south, east, and west, meeting at a wide central",
      "point. Grassy hills and scattered bushes on either side of the roads. Far in",
      "the background, the distant silhouette of a castle turret peeks over a low hill.",
    ].join(" "),
    light: DAYLIGHT,
  },
  6: {
    scene: [
      "A simple dirt road stretching endlessly toward the horizon through open",
      "rolling countryside, a single stylized cartoon tree with a rounded leafy",
      "canopy standing on a small grassy rise beside the road. Lush green grass and",
      "low bushes line the roadside. Far in the distance behind, the hazy silhouette",
      "of tall castle spires rises above the landscape.",
    ].join(" "),
    light: DAYLIGHT,
  },
  13: {
    scene: [
      "Rolling green hills, a deeply rutted dirt road curving from the horizon toward",
      "the viewer. A single gnarled, bare, leafless silhouette tree stands stark",
      "against the sky on a distant hilltop to the right. Far to the upper right, a",
      "jagged ridge of icy blue-white mountain peaks rises on the horizon.",
    ].join(" "),
    light: DAYLIGHT,
  },
  // The remaining five are recorded exactly as they were generated, lighting
  // included, so the manifest reproduces the art actually shipped. Their skies
  // do not contradict the originals: 65 and 70 stand against dark and pale
  // Apple II backdrops respectively, and 90 and 91 are interiors.
  65: {
    scene: [
      "A clear white-water mountain stream running through a dense pine forest at",
      "dusk, with a tall waterfall crashing down rocky cliffs to the east amid dark",
      "evergreen trees.",
    ].join(" "),
    light: [
      "Moody deep blue-green forest shadows, mist rising off the churning water, a",
      "few streaks of pink twilight sky visible through the tree canopy above.",
    ].join(" "),
  },
  70: {
    scene: [
      "Dramatic view of tall, rugged, impassable snow-capped mountain peaks filling",
      "the scene, jagged rocky cliffs streaked with pink and white snow, a dark",
      "cave-like gap at the base where a waterfall roars down between dark evergreen",
      "trees.",
    ].join(" "),
    light: "Soft fluffy clouds drifting past the peaks, pale green-gold sky.",
  },
  90: {
    figures: true,
    scene: [
      "A grand medieval throne room rendered as a colorful storybook cartoon: tall",
      "arched windows, cheerful banners, patterned floor tiles. A rotund, comically",
      "stern King Galt with a big bushy beard and oversized crown sits on an ornate",
      "golden throne; his glamorous mistress lounges beside him with exaggerated",
      "elegant features. Gorn, the king's champion, is a huge broad-shouldered cartoon",
      "knight in shining armor with an arrogant smirk, arms crossed. A young",
      "noblewoman, Lady Diana, kneels before the throne in a simple dress with big",
      "expressive eyes, pleading. Whimsical cartoon courtiers with exaggerated",
      "silhouettes watch from the sides.",
    ].join(" "),
    light: "Warm inviting lighting.",
  },
  91: {
    figures: true,
    scene: [
      "Interior of a cluttered medieval provisioner's shop, seen from the customer's",
      "point of view looking across a wooden counter. Behind the counter, a friendly",
      "middle-aged shopkeeper woman with a warm smile, wearing a simple apron and a",
      "colorful headscarf, leans forward with her hands on the counter, chatting.",
      "Shelves behind her are stuffed with sacks, jars, coiled rope, and bundled",
      "goods. On the counter in front of her sits an open parchment supply list and a",
      "small inkwell.",
    ].join(" "),
    light: "Warm cozy lighting.",
  },
  92: {
    scene: [
      "Wide exterior landscape view of a large, time-worn stone castle with round",
      "towers and conical rooftops, surrounded by a murky stagnant moat, seen from a",
      "dirt road approaching from the north. A small wooden drawbridge crosses the",
      "moat to a dark archway entrance. Rolling green hills and distant tree line",
      "behind the castle. The dirt road curves toward the viewer in the foreground,",
      "continuing off toward the horizon.",
    ].join(" "),
    light: "A bright cartoon sky with fluffy clouds above.",
  },
};

export function buildPrompt(picture) {
  const entry = SCENES[picture];
  if (!entry) throw new Error(`no scene for picture ${picture}`);
  const opening = entry.figures
    ? `${STYLE} ${FIGURES} ${COLOUR}`
    : `${STYLE} ${COLOUR}`;
  const closing = entry.figures ? CLOSING.peopled : CLOSING.landscape;
  return `${opening} ${entry.scene} ${entry.light} ${closing}`;
}

async function main() {
  const args = process.argv.slice(2);
  const one = args.indexOf("--picture");
  if (one !== -1) {
    console.log(buildPrompt(Number(args[one + 1])));
    return;
  }

  const game = JSON.parse(
    await Bun.file(resolve(questRoot, "quest_port_kit/game.json")).text(),
  );

  const manifest = Object.keys(SCENES)
    .map(Number)
    .sort((a, b) => a - b)
    .map((picture) => ({
      picture,
      rooms: game.rooms.filter((r) => r.picture === picture).map((r) => r.id),
      webp: `the-quest/frontend/public/art-cartoon/p${picture}.webp`,
      light: SCENES[picture].light,
      prompt: buildPrompt(picture),
    }));

  const out = resolve(questRoot, "art-prompts.json");
  await writeFile(out, `${JSON.stringify({ model: MODEL, scenes: manifest }, null, 2)}\n`);
  console.log(`wrote ${out}: ${manifest.length} prompts`);
}

await main();
