#!/usr/bin/env bun
// Builds the scene-art prompt manifest from the game data.
//
//   bun tools/art-prompts.mjs                      # write web/art-prompts.json
//   bun tools/art-prompts.mjs --room 1             # print one prompt and exit
//   bun tools/art-prompts.mjs --style cel          # a different look entirely
//   bun tools/art-prompts.mjs --style cel --room 1
//
// The point of generating these rather than hand-writing 38 prompts: the style
// contract lives in one place, so retuning it is one edit and a re-run, and the
// prompts are version-controlled and diffable. A room that comes out wrong is a
// one-line change plus one regeneration, not a re-derivation.

import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Style contracts. The whole set is generated with one of these, repeated
// verbatim in every prompt -- that repetition is what makes 38 separately
// generated images read as a single set. Switch with --style; add a new entry
// to try a look without disturbing the ones already generated.
const STYLES = {
  // The original look, established by art/pic-enhanced.webp and art/room-1.webp.
  painterly: [
    "Moonlit gothic matte painting in the style of an oil-on-canvas book illustration.",
    "Desaturated blue-black night palette; warm amber appears only where a real light source justifies it.",
    "Heavy atmospheric haze, deep shadow occupying the lower third, a single cool key light from a high moon.",
    "Painterly, not photographic. No figures or people. No text, letters, signs, compass markings or map symbols.",
    "Square composition, subject centred, no important detail touching the frame edge.",
  ].join(" "),

  // Hard edges and linework instead of atmosphere; depth from layered geometry
  // rather than fog.
  cel: [
    "Cel-shaded graphic-novel illustration with bold, confident ink linework defining every form.",
    "Hard edges and flat planes of colour; no soft gradients and no atmospheric fog.",
    "Depth built from layered, silhouetted vector shapes receding in scale rather than from haze.",
    "Lighting simplified to high-contrast cel-shading: two or three discrete tonal steps, sharp shadow boundaries.",
    "Punchy saturated palette of deep purples and teals, with a small number of bright accent highlights.",
    "Graphic and stylised, not photographic. No figures or people.",
    "No text, letters, signs, runes, glyphs or carved inscriptions of any kind.",
    "Square composition, subject centred, no important detail touching the frame edge.",
  ].join(" "),
};

// The shipped look. Painterly was the first pass; cel replaced it after a
// three-room comparison (rooms 1, 21 and 10).
const DEFAULT_STYLE = "cel";

// One swapped clause per room type (RT%), so rooms of a kind feel like the same
// place. Types come straight from the extracted data.
const TREATMENTS = {
  1: "Open forest at night: tall conifer silhouettes, the moon visible above the treeline, a dirt path underfoot.",
  2: "Standing outside a structure at night: the building's mass reads as a dark silhouette against a moonlit sky.",
  4: "A small cramped interior at night, lit by a single candle or hearth; tight framing, warm amber pooling in the centre. Any doorway or window shows dark night sky outside, never daylight.",
  5: "A rough timber interior at night: log walls, plank floor, warmer brown tones, one small window admitting moonlight. Any doorway or window shows dark night sky outside, never daylight.",
  6: "A vast stone chamber: cold grey masonry, strong vertical scale, light falling from far above.",
  7: "An enclosed underground space: no sky, damp rock, wet mineral glints, almost no light beyond a faint glow.",
  8: "An indistinct liminal space, heavy fog, almost featureless.",
};

// Where the room's type clause fights the actual subject. Room 8's type is 2
// ("outside a structure"), but a rock slide is a natural feature, not a
// building -- the generic clause pulled the image toward masonry. Overrides are
// recorded here so the manifest matches the art that was actually generated.
const TREATMENT_OVERRIDES = {
  // Room 32 has no description at all in the ROOMS file. The type-8 clause says
  // "heavy fog", which the cel contract explicitly forbids -- so it gets a
  // flat-planes void instead of a haze.
  32: "An empty liminal void: flat overlapping planes of deep colour receding into blackness, no floor, no horizon, no objects at all.",
  33: "A stone dungeon chamber at night: rough block walls, a low arched exit, an iron sconce guttering, straw on the flagstones.",
  35: "A royal treasure vault at night: a tall stone chamber heaped with coin, plate and gilded chests, a stone stair rising, everything catching hard glints of gold against deep shadow.",
  37: "A high tower chamber flooded with moonlight at night: tall arched windows admitting broad cold shafts of light across a bare stone floor.",
  16: "A moonlit lake shore at night: still dark water stretching to a far treeline, a pebbled bank in the foreground, conifer silhouettes framing the edges.",
  18: "Dense oppressive forest at night: gnarled dead trees with clawing bare branches crowding close, the path narrowing between them, only a sliver of moonlit sky above.",
  19: "A dirt road at night running between two buildings: a small grim shack ahead and a log cabin behind, both dark silhouettes with a little warm light at their windows, conifer forest beyond.",
  22: "A concealed stone chamber behind a wall at night: bare cold masonry, a low vaulted ceiling, a single guttering candle, dust and cobwebs, no windows.",
  25: "A large open attic at night: bare rafters overhead, stored clutter under dust sheets, a single shaft of moonlight from a gable window, stairs descending.",
  26: "An open sandy field at night: pale windblown sand and sparse scrub grass, low dunes, a wide moonlit sky, the forest only a distant dark line.",
  31: "A stone cellar at night: cold damp walls, a heavy iron-bound vault door dominating one side, a lantern the only light, no windows.",
  // RT% type 7 means "enclosed" and mostly means caves, but it also covers a
  // treetop, a castle entranceway, a tower room and the inside of a wagon --
  // the generic underground clause is badly wrong for those four.
  15: "High in the crown of an enormous willow at night: a platform of thick boughs with hanging curtains of leaves, the moonlit forest canopy spread out below. A blank weathered board hangs from a branch.",
  27: "A vaulted stone entrance passage inside a castle at night: cold masonry, iron torch brackets throwing pools of flame-light, arched openings leading off to either side.",
  36: "A high tower chamber of cold stone at night, a stone stair descending into darkness; tall narrow windows admit shafts of moonlight.",
  38: "Inside the bed of a broken wooden wagon at night, looking out past splintered planks and a torn canvas cover at the moonlit forest beyond.",
  1: "Open forest at night: tall conifer silhouettes, the moon visible above the treeline, a dirt path underfoot. The stump's face carries faint worn carvings that read as abstract marks rather than letters -- this is the only carved surface in the game's art.",
  8: "Standing outside at night before a rocky hillside: the collapsed cave mouth and its heaped boulders read as a dark mass against a moonlit sky.",
  // The type-5 clause alone (log walls, plank floor) left the cabin empty --
  // added the fireplace and table now that ROOM_SCENERY (rules.js) and
  // ROOM_FLAVOR (describe.js) give the player things to examine there. The
  // deer head was already in the shipped art, on the right-hand wall, and
  // has to stay there and stay put: it's the wall PULL ANTLERS spins
  // (TRANS.bas:4703), so the fireplace goes on the left wall instead, not
  // built into the same wall as the antlers, which wouldn't read as
  // something that could swing open. NOTE: the shipped art for this room
  // was produced by image-editing the original reference (to add the
  // fireplace, table, kettle/jugs and plate while holding the window and
  // deer head fixed in place) rather than from this prompt via plain
  // text-to-image -- regenerating from this string alone would not reliably
  // reproduce that exact layout, and the shipped image no longer shows the
  // doorway the original had on the left wall (replaced by the fireplace).
  21: "A rough timber interior at night: log walls, plank floor, warmer brown tones, a mounted deer's head with wide antlers on the right-hand wall, a small cold stone fireplace on the left wall with a cast-iron kettle and a couple of clay jugs on its mantel, a rough-hewn table and stool in front of the fireplace with a wooden plate and a half-eaten meal left on the table, one small window admitting moonlight in the back wall. Any doorway or window shows dark night sky outside, never daylight.",
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

const styleArg = process.argv.indexOf("--style");
const styleName = styleArg === -1 ? DEFAULT_STYLE : process.argv[styleArg + 1];
if (!(styleName in STYLES)) {
  throw new Error(`unknown style '${styleName}'. Available: ${Object.keys(STYLES).join(", ")}`);
}
const STYLE = STYLES[styleName];

/** Non-default styles get a suffixed filename so sets never overwrite each other. */
const suffix = styleName === DEFAULT_STYLE ? "" : `.${styleName}`;

function buildPrompt(room) {
  const subject = toSubject(room.desc);
  const treatment = TREATMENT_OVERRIDES[room.id] ?? TREATMENTS[room.type] ?? TREATMENTS[1];
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
  png: `web/public/art/room-${room.id}${suffix}.png`,
  webp: `web/public/art/room-${room.id}${suffix}.webp`,
  prompt: buildPrompt(room),
}));

const roomArg = process.argv.indexOf("--room");
if (roomArg !== -1) {
  const id = Number(process.argv[roomArg + 1]);
  const entry = manifest.find((room) => room.id === id);
  if (!entry) throw new Error(`no room ${id}`);
  console.log(entry.prompt);
} else {
  const destination = resolve(repoRoot, `web/art-prompts${suffix}.json`);
  await writeFile(destination, `${JSON.stringify(manifest, null, 2)}\n`);
  const byType = manifest.reduce((counts, room) => {
    counts[room.type] = (counts[room.type] ?? 0) + 1;
    return counts;
  }, {});
  console.log(`wrote ${manifest.length} '${styleName}' prompts -> web/art-prompts${suffix}.json`);
  console.log("rooms by type:", byType);
}
