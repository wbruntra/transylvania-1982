#!/usr/bin/env node
// Regenerates the web app's copy of the game data from the extraction kit.
//
// trans_port_kit/game.json is the single source of truth: it is what the
// extractor writes from the Apple II .do images. Never hand-edit the copy under
// web/public -- edit the extractor (or the kit file) and re-run this script.
//
// Object 40 (the mousetrap, room 20) is a hand-added exception: it isn't in
// TRANS.bas or the disk image, it's new gameplay (see turnHooks.js and
// rules.js). Re-running the extractor from scratch would need it re-added.
//
//   node tools/sync-data.mjs
//
// Runs automatically via the `predev` / `prebuild` npm scripts in web/.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(repoRoot, "trans_port_kit/game.json");
const destination = resolve(repoRoot, "web/public/game.json");

// Keys the web app depends on. `noun_map_N`, `verb_targets` and `counts` are
// the vocabulary tables the earlier hand-copied game.json had silently dropped;
// asserting on them here is what stops that from happening again.
const REQUIRED_KEYS = [
  "rooms",
  "objects",
  "verbs",
  "nouns",
  "noun_map_N",
  "verb_targets",
  "counts",
];

const raw = JSON.parse(await readFile(source, "utf8"));

const missing = REQUIRED_KEYS.filter((key) => !(key in raw));
if (missing.length > 0) {
  throw new Error(`${source} is missing required key(s): ${missing.join(", ")}`);
}

const unexpected = Object.keys(raw).filter((key) => !REQUIRED_KEYS.includes(key));
if (unexpected.length > 0) {
  // A stray top-level `exits` key (room 1's exit record, leaked out of the
  // extractor) is exactly the kind of thing worth failing loudly on.
  throw new Error(`${source} has unexpected top-level key(s): ${unexpected.join(", ")}`);
}

const { counts, rooms, objects, verbs, nouns, noun_map_N: nounMap } = raw;
if (rooms.length !== counts.LZ) throw new Error(`expected ${counts.LZ} rooms, got ${rooms.length}`);
if (objects.length !== counts.M) throw new Error(`expected ${counts.M} objects, got ${objects.length}`);
if (nounMap.length !== counts.NZ) throw new Error(`expected ${counts.NZ} nouns, got ${nounMap.length}`);
if (nouns.length !== counts.NZ) throw new Error(`expected ${counts.NZ} noun words, got ${nouns.length}`);
if (verbs.length !== raw.verb_targets.length) {
  throw new Error(`${verbs.length} verbs but ${raw.verb_targets.length} dispatch targets`);
}

await mkdir(dirname(destination), { recursive: true });
await writeFile(destination, `${JSON.stringify(raw, null, 1)}\n`);

console.log(
  `synced ${rooms.length} rooms, ${objects.length} objects, ${verbs.length} verbs, ` +
    `${nouns.length} nouns -> web/public/game.json`,
);
