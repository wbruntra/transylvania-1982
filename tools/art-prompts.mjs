#!/usr/bin/env node
// Builds the scene-art prompt manifest from the game data.
//
//   node tools/art-prompts.mjs            # write web/art-prompts.json
//   node tools/art-prompts.mjs --room 1   # print one prompt and exit
//
// The point of generating these rather than hand-writing 38 prompts: the style
// contract lives in one place, so retuning it is one edit and a re-run, and the
// prompts are version-controlled and diffable. A room that comes out wrong is a
// one-line change plus one regeneration, not a re-derivation.

import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// The shared contract. Repeated verbatim in every prompt -- this is what makes
// 38 separately generated images read as one set. Derived from the look already
// established by art/pic-enhanced.webp and art/room-1.webp.
const STYLE = [
  "Moonlit gothic matte painting in the style of an oil-on-canvas book illustration.",
  "Desaturated blue-black night palette; warm amber appears only where a real light source justifies it.",
  "Heavy atmospheric haze, deep shadow occupying the lower third, a single cool key light from a high moon.",
  "Painterly, not photographic. No figures or people. No text, letters, signs, compass markings or map symbols.",
  "Square composition, subject centred, no important detail touching the frame edge.",
].join(" ");

// One swapped clause per room type (RT%), so rooms of a kind feel like the same
// place. Types come straight from the extracted data.
const TREATMENTS = {
  1: "Open forest at night: tall conifer silhouettes, the moon visible above the treeline, a dirt path underfoot.",
  2: "Standing outside a structure at night: the building's mass reads as a dark silhouette against a moonlit sky.",
  4: "A small cramped interior lit by a single candle or hearth; tight framing, warm amber pooling in the centre.",
  5: "A rough timber interior: log walls, plank floor, warmer brown tones, one small window admitting moonlight.",
  6: "A vast stone chamber: cold grey masonry, strong vertical scale, light falling from far above.",
  7: "An enclosed underground space: no sky, damp rock, wet mineral glints, almost no light beyond a faint glow.",
  8: "An indistinct liminal space, heavy fog, almost featureless.",
};

const DIRECTION_NAMES = {
  N: "north",
  S: "south",
  W: "west",
  E: "east",
  U: "above",
  D: "below",
};

// The descriptions were typed to fit a 40-column screen, and a few words ran
// together at the wrap. Fixed explicitly rather than by a clever rule, because
// there are only five of them and a clever rule would eventually be wrong.
const WRAP_ARTEFACTS = [
  [/\bADOOR\b/gi, "A DOOR"],
  [/\bRESTSA\b/gi, "RESTS A"],
  [/\bSLOPEUP\b/gi, "SLOPE UP"],
  [/HORSE-\s+DRAWN/gi, "HORSE-DRAWN"],
  [/ENTRANCEWAY\.OTHER/gi, "ENTRANCEWAY. OTHER"],
];

/**
 * Turns a room description into an image subject: navigation clauses describe
 * the map rather than the view, and compass letters would otherwise get painted
 * into the picture as lettering.
 */
function toSubject(desc) {
  let text = desc.replace(/^YOU ARE\s+/i, "").replace(/\s+/g, " ");
  for (const [pattern, replacement] of WRAP_ARTEFACTS) {
    text = text.replace(pattern, replacement);
  }
  return text
    // "AN EXIT GOES E.", "PATHS LEAD N/W.", "OTHER EXITS LEAD W & E.",
    // "STAIRS SLOPE UP AND DOWN." -- article included so no "an" is left behind.
    .replace(
      /\b(?:AN?|THE|OTHER)?\s*\b(?:PATHS?|EXITS?|STAIRS|DOORS?|WAYS?)\s+(?:GO|GOES|LEADS?|LIES?|IS|ARE|SLOPES?)\b[^.]*\.?/gi,
      "",
    )
    .replace(/\b[NSEW](?:\/[NSEW])+\b/gi, "") // "N/S dirt road", "N/W/E paths"
    .replace(/\bTO THE [NSEWUD]\b/gi, "in the distance") // "TO THE N LIES A CASTLE"
    .replace(/\s+([.,])/g, "$1")
    .replace(/\s+/g, " ")
    .replace(/^[.\s]+|[\s]+$/g, "")
    .toLowerCase();
}

/** A natural-language spatial hint, from the exits rather than the prose. */
function toSpatialHint(exits) {
  const ways = Object.entries(exits)
    .filter(([, destination]) => destination > 0)
    .map(([direction]) => DIRECTION_NAMES[direction]);
  if (ways.length === 0) return "";
  if (ways.length === 1) return ` A way out leads ${ways[0]}.`;
  return ` Ways out lead ${ways.slice(0, -1).join(", ")} and ${ways.at(-1)}.`;
}

function buildPrompt(room) {
  const subject = toSubject(room.desc);
  const treatment = TREATMENTS[room.type] ?? TREATMENTS[1];
  const scene = subject
    ? `The scene: ${subject.endsWith(".") ? subject : `${subject}.`}`
    : "The scene: an empty, featureless space.";
  return `${scene}${toSpatialHint(room.exits)} ${treatment} ${STYLE}`;
}

const data = JSON.parse(await readFile(resolve(repoRoot, "web/public/game.json"), "utf8"));
const manifest = data.rooms.map((room) => ({
  id: room.id,
  type: room.type,
  subject: toSubject(room.desc),
  // generate_image writes PNG; convert_to_webp then produces the shipped file
  // and the PNG is deleted. scene.js looks for the .webp first.
  png: `web/public/art/room-${room.id}.png`,
  webp: `web/public/art/room-${room.id}.webp`,
  prompt: buildPrompt(room),
}));

const roomArg = process.argv.indexOf("--room");
if (roomArg !== -1) {
  const id = Number(process.argv[roomArg + 1]);
  const entry = manifest.find((room) => room.id === id);
  if (!entry) throw new Error(`no room ${id}`);
  console.log(entry.prompt);
} else {
  const destination = resolve(repoRoot, "web/art-prompts.json");
  await writeFile(destination, `${JSON.stringify(manifest, null, 2)}\n`);
  const byType = manifest.reduce((counts, room) => {
    counts[room.type] = (counts[room.type] ?? 0) + 1;
    return counts;
  }, {});
  console.log(`wrote ${manifest.length} prompts -> web/art-prompts.json`);
  console.log("rooms by type:", byType);
}
