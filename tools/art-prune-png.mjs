#!/usr/bin/env bun
// Deletes scene-art PNGs that already have a WebP sibling.
//
//   bun tools/art-prune-png.mjs
//
// generate_image writes PNG, convert_to_webp produces the file the game ships,
// and the PNG is then dead weight (~1.5MB each). A PNG with no WebP beside it is
// left alone, which is what protects art/original-pic.png -- the decoded Apple II
// title bitmap, which is source material rather than a generated asset.

import { readdir, stat, unlink } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const artDirectory = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../web/public/art",
);

const files = await readdir(artDirectory);
const webp = new Set(files.filter((file) => file.endsWith(".webp")));

let freed = 0;
const kept = [];
for (const file of files.filter((name) => name.endsWith(".png"))) {
  if (!webp.has(file.replace(/\.png$/, ".webp"))) {
    kept.push(file);
    continue;
  }
  const path = join(artDirectory, file);
  freed += (await stat(path)).size;
  await unlink(path);
  console.log(`deleted ${file}`);
}

console.log(`freed ${(freed / 1048576).toFixed(1)}MB`);
if (kept.length > 0) console.log(`kept (no webp sibling): ${kept.join(", ")}`);
