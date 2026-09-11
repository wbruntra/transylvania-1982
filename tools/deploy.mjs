#!/usr/bin/env bun
// Builds both games and publishes them to the gh-pages branch.
//
//   bun tools/deploy.mjs              # test, build, commit to gh-pages, push
//   bun tools/deploy.mjs --dry-run    # everything except the push
//   bun tools/deploy.mjs --skip-tests # when you already just ran them
//
// GitHub Pages serves https://wbruntra.github.io/transylvania-1982/ from the
// root of gh-pages, which means the site lives at a *project subpath*, not a
// domain root. Both games are built with `base: './'` and reference their art
// relatively, so they do not care what prefix they end up under -- that is the
// property that makes this work, and the reason not to "fix" either app to use
// absolute paths.
//
// The layout published:
//
//   /                 site/index.html
//   /transylvania/    transylvania/
//   /the-quest/       the-quest/frontend/
//
// Neither game does client-side routing, so every URL is a real file and there
// is no 404 fallback to arrange.
//
// gh-pages is built in a detached git worktree rather than by checking the
// branch out here: the working tree is never touched, so a deploy cannot lose
// uncommitted work, and dist/ never has to be committed to master.

import { $ } from "bun";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(repoRoot, "dist");
const BRANCH = "gh-pages";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const skipTests = args.includes("--skip-tests");

$.cwd(repoRoot);
$.throws(true);

/** The two builds, in the order they are laid into the site. */
const GAMES = [
  { name: "Transylvania", dir: "transylvania", into: "transylvania" },
  { name: "The Quest", dir: "the-quest/frontend", into: "the-quest" },
];

async function build() {
  for (const game of GAMES) {
    console.log(`\n=== ${game.name} (${game.dir})`);
    await $`bun install --frozen-lockfile`.cwd(join(repoRoot, game.dir)).quiet();
    if (!skipTests) await $`bun test`.cwd(join(repoRoot, game.dir));
    await $`bun run build`.cwd(join(repoRoot, game.dir));
  }
}

async function assemble() {
  console.log("\n=== assembling dist/");
  await rm(dist, { recursive: true, force: true });
  await $`mkdir -p ${dist}`;
  await $`cp ${join(repoRoot, "site/index.html")} ${join(dist, "index.html")}`;
  for (const game of GAMES) {
    await $`cp -r ${join(repoRoot, game.dir, "dist")} ${join(dist, game.into)}`;
  }
  // Branch-based Pages runs Jekyll over the tree unless told not to, which
  // would drop anything whose name begins with an underscore. The workflow
  // deploy never needed this; a branch deploy does.
  await writeFile(join(dist, ".nojekyll"), "");

  for (const game of GAMES) {
    const index = join(dist, game.into, "index.html");
    if (!(await Bun.file(index).exists())) throw new Error(`missing ${index}`);
  }
  await $`du -sh ${join(dist, "index.html")} ${GAMES.map((g) => join(dist, g.into))}`;
}

async function publish() {
  const sha = (await $`git rev-parse --short HEAD`.text()).trim();
  const describe = (await $`git log -1 --pretty=%s`.text()).trim();
  const dirty = (await $`git status --porcelain`.text()).trim();
  if (dirty) {
    console.warn(
      "\nwarning: working tree has uncommitted changes -- deploying what is on\n" +
        "disk, which is not exactly what master contains.",
    );
  }

  // Start from the published branch if it already exists, so history accretes
  // rather than forking.
  await $`git fetch origin ${BRANCH}`.nothrow().quiet();
  const exists =
    (await $`git rev-parse --verify --quiet refs/remotes/origin/${BRANCH}`.nothrow().quiet())
      .exitCode === 0;

  const work = await mkdtemp(join(tmpdir(), "gh-pages-"));
  try {
    if (exists) {
      await $`git worktree add --force ${work} -B ${BRANCH} origin/${BRANCH}`.quiet();
    } else {
      console.log(`\n=== ${BRANCH} does not exist on origin yet, creating it`);
      // A local gh-pages here is a leftover from a --dry-run, and `checkout
      // --orphan` refuses to overwrite it. It has never been published, so
      // there is nothing in it worth keeping.
      await $`git branch -D ${BRANCH}`.nothrow().quiet();
      await $`git worktree add --force --detach ${work}`.quiet();
      await $`git checkout --orphan ${BRANCH}`.cwd(work).quiet();
      await $`git rm -rf --quiet .`.cwd(work).nothrow().quiet();
    }

    // Replace the contents wholesale: files deleted from the build must
    // disappear from the site, not linger from an older deploy.
    await $`find ${work} -mindepth 1 -maxdepth 1 -not -name .git -exec rm -rf {} +`;
    await $`cp -r ${dist}/. ${work}/`;

    await $`git add -A`.cwd(work);
    const staged = (await $`git status --porcelain`.cwd(work).text()).trim();
    if (!staged) {
      console.log("\nNothing changed since the last deploy.");
      return;
    }

    const message = `Deploy ${sha}${dirty ? " (dirty tree)" : ""}\n\n${describe}`;
    await $`git commit -q -m ${message}`.cwd(work);
    console.log(`\n=== committed to ${BRANCH}`);
    await $`git --no-pager log -1 --stat --oneline`.cwd(work);

    if (dryRun) {
      console.log(`\n--dry-run: not pushing. Undo with: git branch -D ${BRANCH}`);
      return;
    }
    await $`git push origin ${BRANCH}`.cwd(work);
    console.log(`\nDeployed. https://wbruntra.github.io/transylvania-1982/`);
  } finally {
    await $`git worktree remove --force ${work}`.nothrow().quiet();
  }
}

await build();
await assemble();
await publish();
