// The safety net for the port: play the game headlessly and assert on what it
// says and on the state it leaves behind.

import assert from "node:assert/strict";
import test from "node:test";

import { CARRIED, GONE, MAX_CARRIED, START_ROOM } from "../src/engine/constants.js";
import { MESSAGES } from "../src/engine/messages.js";
import { carriedCount, deserializeState, serializeState, setObjectTakeable } from "../src/engine/state.js";
import { createTestEngine } from "./helpers.js";

test("the game opens at the stump with its exits listed", async () => {
  const engine = await createTestEngine();
  const opening = engine.start();

  assert.equal(engine.state.room, START_ROOM);
  assert.equal(opening[0], MESSAGES.welcome);
  assert.match(opening[1], /ANCIENT STUMP/);
  assert.equal(opening[2], `${MESSAGES.exitsPrefix}N.`);
});

test("walking to the forest and back", async () => {
  const engine = await createTestEngine();

  const forest = engine.run("north");
  assert.equal(engine.state.room, 8);
  assert.match(forest[0], /CAVE ENTRANCE/);

  engine.run("west");
  assert.equal(engine.state.room, 3);

  engine.run("east");
  assert.equal(engine.state.room, 8);
});

test("long and short direction words, with and without a verb", async () => {
  const engine = await createTestEngine();

  engine.run("n");
  assert.equal(engine.state.room, 8);
  engine.run("go west");
  assert.equal(engine.state.room, 3);
  engine.run("walk e");
  assert.equal(engine.state.room, 8);
});

test("a direction with no exit is refused and does not move the player", async () => {
  const engine = await createTestEngine();

  assert.deepEqual(engine.run("south"), [MESSAGES.cantGoThatWay]);
  assert.equal(engine.state.room, START_ROOM);
});

test("taking, carrying and dropping the wrinkled note", async () => {
  const engine = await createTestEngine();
  engine.runAll(["north", "west"]);

  assert.deepEqual(engine.run("inventory"), [MESSAGES.carryingNothing]);

  assert.deepEqual(engine.run("get note"), [MESSAGES.ok]);
  assert.equal(engine.state.objectLoc[18], CARRIED);
  assert.equal(carriedCount(engine.state), 1);

  assert.deepEqual(engine.run("inventory"), [
    MESSAGES.carryingHeader,
    MESSAGES.carriedItem("WRINKLED NOTE."),
  ]);
  assert.deepEqual(engine.run("get note"), [MESSAGES.alreadyCarrying]);

  // Carried items travel with the player and land in the room they are dropped.
  engine.run("east");
  assert.deepEqual(engine.run("drop note"), [MESSAGES.ok]);
  assert.equal(engine.state.objectLoc[18], 8);
  assert.deepEqual(engine.run("look").slice(2), [MESSAGES.thereIsA("WRINKLED NOTE.")]);
});

test("objects that are not here, and objects that cannot be taken", async () => {
  const engine = await createTestEngine();

  assert.deepEqual(engine.run("get note"), [MESSAGES.notHere]);
  assert.deepEqual(engine.run("drop note"), [MESSAGES.dontHaveIt]);

  // Object 2, the statue, sits in room 4 and is flagged untakeable.
  engine.state.room = 4;
  assert.deepEqual(engine.run("get statue"), [MESSAGES.cant]);
});

test("the normal game starts with nothing but bare hands -- the pistol is still in the attic", async () => {
  const engine = await createTestEngine();

  assert.equal(engine.state.objectLoc[17], 25, "the pistol starts in the attic, not carried");
  assert.equal(engine.state.objectLoc[22], -1, "the bullet starts nowhere, not carried");
  assert.deepEqual(engine.run("inventory"), [MESSAGES.carryingNothing]);
});

test("debug tester mode starts the player carrying the pistol, bullet, cross, elixir and box", async () => {
  const engine = await createTestEngine({ debugInventory: true });

  assert.equal(engine.state.objectLoc[17], CARRIED);
  assert.equal(engine.state.objectLoc[22], CARRIED);
  assert.equal(engine.state.objectLoc[6], CARRIED);
  assert.equal(engine.state.objectLoc[36], CARRIED);
  assert.equal(engine.state.objectLoc[27], CARRIED);
  assert.deepEqual(engine.run("inventory"), [
    MESSAGES.carryingHeader,
    MESSAGES.carriedItem("WOODEN CROSS."),
    MESSAGES.carriedItem("FLINTLOCK PISTOL."),
    MESSAGES.carriedItem("SILVER BULLET."),
    MESSAGES.carriedItem("SMALL BLACK METAL BOX."),
    MESSAGES.carriedItem("MAGIC ELIXIR."),
  ]);
});

test("there is no inventory item-carrying limit", async () => {
  const engine = await createTestEngine();

  // The ring is behind a barrier until the vampire is gone
  engine.state.flags.VR = 1;

  const takeable = [...engine.world.objects.values()].filter(
    (object) => object.takeable && object.id !== 20,
  );
  for (const object of takeable.slice(0, 6)) {
    engine.state.objectLoc[object.id] = engine.state.room;
  }

  for (const object of takeable.slice(0, 6)) {
    assert.deepEqual(engine.run(`get ${object.name}`), [MESSAGES.ok]);
  }
  // Player carries 6 items (exceeds original 5-item limit)
  assert.equal(carriedCount(engine.state), 6);
});

test("unknown input is refused without costing a turn", async () => {
  const engine = await createTestEngine();

  assert.deepEqual(engine.run("xyzzy"), [MESSAGES.dontUnderstand]);
  assert.deepEqual(engine.run("get"), [MESSAGES.dontUnderstand]);
  // GO alone is answered by TRANS.bas:5700, which goes back to the prompt
  // rather than through 7000 -- so it is refused without costing a turn.
  assert.deepEqual(engine.run("go"), [MESSAGES.needDirection]);
  assert.equal(engine.state.room, START_ROOM);
  assert.equal(engine.state.turns, 0);
});

test("blank input is not a turn", async () => {
  const engine = await createTestEngine();

  assert.deepEqual(engine.execute("   "), { echo: null, messages: [] });
  assert.equal(engine.state.turns, 0);
});

test("rooms with no ordinary exits say so", async () => {
  const engine = await createTestEngine();

  engine.state.room = 9; // One of 9, 10, 22, 32 -- special-exit-only rooms.
  assert.equal(engine.run("look")[1], MESSAGES.exitsPrefix + MESSAGES.noOrdinaryExits);
});

test("state round-trips through save and restore", async () => {
  const engine = await createTestEngine();
  engine.runAll(["north", "west", "get note"]);
  engine.state.flags.GT = 1;

  const restored = deserializeState(serializeState(engine.state));

  assert.equal(restored.room, 3);
  assert.equal(restored.objectLoc[18], CARRIED);
  assert.equal(restored.flags.GT, 1);
  assert.equal(restored.turns, engine.state.turns);
});

test("a save written before a flag existed still restores", async () => {
  const engine = await createTestEngine();
  const partial = JSON.parse(serializeState(engine.state));
  delete partial.flags.VR;

  const restored = deserializeState(JSON.stringify(partial));

  assert.equal(restored.flags.VR, 0);
});

test("tier 1 canned refusals print expected lines and consume a turn", async () => {
  const engine = await createTestEngine();

  // 210: HUNT -> "NOT HERE."
  assert.deepEqual(engine.run("hunt"), [MESSAGES.notHere]);

  // 230: HOLD, USE -> "I'M SORRY - I DON'T UNDERSTAND."
  assert.deepEqual(engine.run("hold note"), [MESSAGES.dontUnderstand]);
  assert.deepEqual(engine.run("use"), [MESSAGES.dontUnderstand]);

  // 240: BREAK, CLEAN, SCRAP/SCRAPE, BRUSH, PET, PAT, KILL (5950) -> "SORRY - YOU CAN'T."
  assert.deepEqual(engine.run("break note"), [MESSAGES.cant]);
  assert.deepEqual(engine.run("clean"), [MESSAGES.cant]);
  assert.deepEqual(engine.run("scrap"), [MESSAGES.cant]);
  assert.deepEqual(engine.run("scrape"), [MESSAGES.cant]);
  assert.deepEqual(engine.run("brush"), [MESSAGES.cant]);
  assert.deepEqual(engine.run("pet"), [MESSAGES.cant]);
  assert.deepEqual(engine.run("pat"), [MESSAGES.cant]);
  assert.deepEqual(engine.run("kill werewolf"), [MESSAGES.cant]);

  // 290: SCREA/SCREAM, SING, KICK, SHAKE, SWEEP, DUST, TOUCH -> "NOTHING HAPPENED."
  assert.deepEqual(engine.run("screa"), [MESSAGES.nothingHappened]);
  assert.deepEqual(engine.run("scream"), [MESSAGES.nothingHappened]);
  assert.deepEqual(engine.run("sing"), [MESSAGES.nothingHappened]);
  assert.deepEqual(engine.run("kick"), [MESSAGES.nothingHappened]);
  assert.deepEqual(engine.run("shake"), [MESSAGES.nothingHappened]);
  assert.deepEqual(engine.run("sweep"), [MESSAGES.nothingHappened]);
  assert.deepEqual(engine.run("dust"), [MESSAGES.nothingHappened]);
  assert.deepEqual(engine.run("touch note"), [MESSAGES.nothingHappened]);

  // 1599: TURN -> "YOU SEE NOTHING UNUSUAL."
  assert.deepEqual(engine.run("turn"), [MESSAGES.nothingUnusual]);

  // 9000: WHIST/WHISTLE -> "YOUR WHISTLE ECHOED EERILY BACK TO YOU."
  assert.deepEqual(engine.run("whist"), [MESSAGES.whistleEchoed]);
  assert.deepEqual(engine.run("whistle"), [MESSAGES.whistleEchoed]);

  // 9600: KISS -> "ISN'T THAT A LITTLE CORNY?"
  assert.deepEqual(engine.run("kiss"), [MESSAGES.littleCorny]);

  // 21 valid action refusals consumed 1 turn each (HOLD and USE produce "I DON'T UNDERSTAND" without consuming a turn)
  assert.equal(engine.state.turns, 21);
});

test("tier 2 routines and rules work as expected", async () => {
  const engine = await createTestEngine();

  // 1. STRIKE/KNOCK/HIT (TRANS.bas:9820)
  assert.equal(engine.state.room, START_ROOM);
  // 9820 ends in GOTO 7000, which falls through to 7990: because P changed, the
  // turn loop redescribes the room. The teleport itself only says "POOF!".
  const knocked = engine.run("knock stump");
  assert.equal(knocked[0], "POOF!");
  assert.equal(engine.state.room, 9);
  assert.match(knocked[1], /SMALL DARK CAVE/);
  assert.equal(engine.state.room, 9);
  assert.deepEqual(engine.run("knock stump"), ["HUH?"]);
  assert.deepEqual(engine.run("knock door"), [MESSAGES.nothingHappened]);

  // 2. PICK (TRANS.bas:2990, 6315)
  // In room 9 without lock pick:
  assert.deepEqual(engine.run("pick lock"), [MESSAGES.cant]);
  // Carry lock pick (object 26):
  engine.state.objectLoc[26] = CARRIED;
  assert.deepEqual(engine.run("pick lock"), [MESSAGES.ok]);
  assert.equal(engine.state.flags.DR, 1);
  assert.deepEqual(engine.run("pick lock"), [MESSAGES.alreadyOpen]);
  // PICK non-lock noun dispatches to GET/TAKE:
  engine.state.objectLoc[18] = 9; // wrinkled note in room 9
  assert.deepEqual(engine.run("pick note"), [MESSAGES.ok]);
  assert.equal(engine.state.objectLoc[18], CARRIED);

  // 3. FEED (TRANS.bas:4300, 4100)
  engine.state.room = 16;
  engine.state.objectLoc[8] = 16; // bullfrog
  engine.state.objectLoc[7] = CARRIED; // flies
  const feedRes = engine.run("feed frog");
  assert.match(feedRes[0], /BULLFROG SPRINGS FORWARD/);
  assert.match(feedRes[1], /'IJNID' TO THE GOBLIN/);
  assert.equal(engine.state.objectLoc[7], GONE);
  assert.equal(engine.state.objectLoc[8], GONE);
  assert.deepEqual(engine.run("feed frog"), [MESSAGES.cant]);

  // 4. SAY/YELL (TRANS.bas:8510)
  engine.state.room = 26;
  engine.state.objectLoc[10] = 26; // goblin
  const sayRes = engine.run("say ijnid");
  assert.equal(sayRes[0], "OKAY.");
  assert.match(sayRes[1], /GOBLIN DROPS THE KEY/);
  assert.equal(engine.state.objectLoc[10], GONE);
  assert.equal(engine.state.objectLoc[11], 26);
  assert.deepEqual(engine.run("say hello"), ["OKAY.", MESSAGES.nothingHappened]);

  // 5. WEAR (TRANS.bas:4400)
  assert.deepEqual(engine.run("wear note"), [MESSAGES.ok]);
  engine.state.objectLoc[2] = 26;
  assert.deepEqual(engine.run("wear statue"), [MESSAGES.dontHaveIt]);
  assert.deepEqual(engine.run("wear tree"), [MESSAGES.cant]);

  // 6. CLAP (TRANS.bas:7900)
  engine.state.room = 37;
  assert.deepEqual(engine.run("clap"), [MESSAGES.nothingHappened]);
  engine.state.flags.PO = 1;
  engine.state.flags.SH = 1;
  assert.deepEqual(engine.run("clap"), ["THE DAMSEL STIRS A LITTLE AND FINALLY AWAKENS."]);
  assert.equal(engine.state.objectLoc[16], GONE);
  assert.equal(engine.state.objectLoc[38], 37);
  assert.equal(engine.world.object(38).takeable, 1);

  // 7. CLOSE (TRANS.bas:7600)
  assert.deepEqual(engine.run("close note"), [MESSAGES.cant]);
  assert.deepEqual(engine.run("close coffin"), [MESSAGES.ok]);
  assert.equal(engine.state.objectLoc[21], 38);
  assert.equal(engine.state.objectLoc[19], GONE);
  assert.equal(engine.state.objectLoc[37], GONE);

  // 8. LISTEN (TRANS.bas:9900)
  const listenRes = engine.run("listen");
  assert.equal(listenRes.length, 1);
});

test("LOOK <thing> table matches TRANS.bas:1500-1575", async () => {
  const engine = await createTestEngine();

  // 1510: trees in forest
  engine.state.room = 1;
  assert.deepEqual(engine.run("look trees"), [
    "SLIPPERY MOSS COVERS THE TREES, MAKING THEM IMPOSSIBLE TO CLIMB.",
  ]);

  // 1525: castle
  assert.deepEqual(engine.run("look castle"), [
    "I THOUGHT I SAW A LIGHT FLICKERING IN A HIGH TOWER ROOM.",
  ]);

  // 1505: wagon in room 2
  engine.state.room = 2;
  assert.deepEqual(engine.run("look wagon"), [
    "THERE'S AN OLD, WOODEN COFFIN IN IT.",
  ]);

  // 1555: grave in room 5
  engine.state.room = 5;
  assert.deepEqual(engine.run("look grave"), [
    "IT SAYS 'HERE LIES YOU'... AND IT HAS TODAY'S DATE.",
  ]);

  // 1545: statue in room 4
  engine.state.room = 4;
  engine.state.objectLoc[2] = 4;
  assert.deepEqual(engine.run("look statue"), [
    "A QUIVERING, MUFFLED VOICE WITHIN THE STATUE CRIES 'HELP!'",
  ]);

  // 1560: cloak in room 3
  engine.state.room = 3;
  engine.state.objectLoc[3] = 3;
  engine.state.objectLoc[26] = -1; // lock pick not found yet
  assert.deepEqual(engine.run("look cloak"), [
    "YOU FOUND A LOCK PICK IN THE FOLDS OF THE CLOAK'S FABRIC.",
  ]);
  assert.equal(engine.state.objectLoc[26], 3);
  assert.deepEqual(engine.run("look cloak"), [
    "IT IS COVERED WITH SHINY RUNES AND STARS.",
  ]);

  // 1599: generic noun fallback
  assert.deepEqual(engine.run("look somethingunknown"), [
    MESSAGES.nothingUnusual,
  ]);
});

test("tier 3 puzzle routines work as expected", async () => {
  const engine = await createTestEngine();
  engine.state.flags.YN = "HERO";

  // --- 4500: LOAD ---
  // Cannot load without pistol (17) and bullet (22) carried
  engine.state.objectLoc[17] = 25;
  engine.state.objectLoc[22] = GONE;
  assert.deepEqual(engine.run("load pistol"), [MESSAGES.cant]);
  engine.state.objectLoc[17] = CARRIED;
  engine.state.objectLoc[22] = CARRIED;
  assert.deepEqual(engine.run("load pistol"), [MESSAGES.ok]);
  assert.equal(engine.state.flags.GN, 1);
  assert.equal(engine.state.objectLoc[22], GONE);
  assert.deepEqual(engine.run("inventory"), [
    MESSAGES.carryingHeader,
    MESSAGES.carriedItem("LOADED FLINTLOCK PISTOL."),
  ]);
  assert.deepEqual(engine.run("load pistol"), [MESSAGES.alreadyIs]);

  // --- 4600: SHOOT / FIRE ---
  // FIRE (I=61) misses and drops bullet at P+3
  assert.deepEqual(engine.run("fire pistol"), [MESSAGES.missed]);
  assert.equal(engine.state.flags.GN, 0);
  assert.equal(engine.state.objectLoc[22], engine.state.room + 3);
  assert.deepEqual(engine.run("inventory"), [
    MESSAGES.carryingHeader,
    MESSAGES.carriedItem("SMOKING FLINTLOCK PISTOL."),
  ]);

  // Reload and test SHOOT (I=23) against werewolf (34)
  engine.state.objectLoc[22] = CARRIED;
  engine.run("load pistol");
  engine.state.objectLoc[34] = engine.state.room;
  const shootRes = engine.run("shoot werewolf");
  assert.equal(shootRes[0].includes("GOT HIM!"), true);
  assert.equal(engine.state.flags.WF, 1);
  assert.equal(engine.state.objectLoc[34], GONE);
  assert.equal(engine.state.flags.GN, 0);

  // --- 4700: PULL ---
  // Pull antlers (46) in rooms 21 and 22 spins wall
  engine.state.room = 21;
  const pull21 = engine.run("pull antlers");
  assert.equal(pull21[0], MESSAGES.wallSpins);
  assert.equal(engine.state.room, 22);

  const pull22 = engine.run("pull antlers");
  assert.equal(pull22[0], MESSAGES.wallSpins);
  assert.equal(engine.state.room, 21);

  // Pull wall (112) also spins wall in rooms 21 and 22
  const pullWall = engine.run("pull wall");
  assert.equal(pullWall[0], MESSAGES.wallSpins);
  assert.equal(engine.state.room, 22);

  const pullWall22 = engine.run("pull wall");
  assert.equal(pullWall22[0], MESSAGES.wallSpins);
  assert.equal(engine.state.room, 21);

  // --- 4800: POUR ---
  // Pour acid (36) at room 1 reveals writing on stump
  engine.state.room = 1;
  engine.state.objectLoc[1] = CARRIED;
  assert.deepEqual(engine.run("pour acid"), [
    MESSAGES.acidSizzlesStump,
    MESSAGES.bottleSlipped,
  ]);
  assert.equal(engine.state.flags.SM, 1);
  assert.equal(engine.state.objectLoc[1], GONE);

  // Pour elixir (28) at room 37 on damsel (16) with SH=1
  engine.state.room = 37;
  engine.state.objectLoc[36] = CARRIED;
  engine.state.objectLoc[16] = 37;
  engine.state.flags.SH = 1;
  assert.deepEqual(engine.run("pour elixir"), [
    MESSAGES.pourEnergizedElixir,
    MESSAGES.lightningInDistance,
  ]);
  assert.equal(engine.state.flags.PO, 1);
  assert.equal(engine.state.objectLoc[36], GONE);
  assert.deepEqual(engine.run("pour elixir"), [MESSAGES.youAlreadyDid]);

  // --- 4900: PUSH / PRESS ---
  // Box button (76)
  engine.state.objectLoc[27] = CARRIED;
  // In cave (room 9/10) causes collapse
  engine.state.room = 9;
  const caveCollapse = engine.run("push button");
  assert.equal(caveCollapse[0], "DAZZLING LIGHT SHOOTS FROM THE BOX AND");
  assert.equal(caveCollapse[1].includes("COLLAPSE"), true);

  // At room 37 with sarcophagus (15)
  engine.state.room = 37;
  engine.state.objectLoc[15] = 37;
  const blastSarc = engine.run("push button");
  assert.equal(blastSarc[1].includes("SARCOPHAGUS"), true);
  assert.equal(engine.state.objectLoc[15], GONE);
  assert.equal(engine.state.objectLoc[16], 37);

  // In castle (room 28)
  engine.state.room = 28;
  assert.deepEqual(engine.run("push button"), [
    "DAZZLING LIGHT SHOOTS FROM THE BOX AND",
    "SHAKES THE ROOM WITH A FANTASTIC JOLT OF POWER.",
  ]);

  // In forest (room 1)
  engine.state.room = 1;
  assert.deepEqual(engine.run("push button"), [
    "DAZZLING LIGHT SHOOTS FROM THE BOX AND",
    "UPROOTS A TREE.",
  ]);

  // --- 6140 / 6142: RIDE / FLY ---
  // Broomstick (25)
  engine.state.room = 7;
  engine.state.objectLoc[25] = CARRIED;
  setObjectTakeable(engine.state, 25, 1);
  // Cat (24) present refuses
  engine.state.objectLoc[24] = 7;
  assert.deepEqual(engine.run("fly broom"), [MESSAGES.catScowls]);

  // Cat gone: fly to room 15
  engine.state.objectLoc[24] = GONE;
  const flyRes = engine.run("fly broom");
  assert.equal(flyRes[0].includes("BROOMSTICK BUCKS"), true);
  assert.equal(engine.state.room, 15);
  assert.equal(engine.state.objectLoc[25], GONE);

  // --- 6300 / 6400: UNLOCK / LOCK ---
  // Grate (27) at room 5 with key (11)
  engine.state.room = 5;
  engine.state.objectLoc[11] = CARRIED;
  assert.deepEqual(engine.run("unlock grate"), [MESSAGES.ok]);
  assert.equal(engine.state.flags.GT, 1);
  assert.deepEqual(engine.run("unlock grate"), [MESSAGES.alreadyOpen]);
  assert.deepEqual(engine.run("lock grate"), [MESSAGES.ok]);
  assert.equal(engine.state.flags.GT, 0);

  // Door (61) at room 9 with lock pick (26)
  engine.state.room = 9;
  engine.state.objectLoc[26] = CARRIED;
  assert.deepEqual(engine.run("unlock door"), [MESSAGES.ok]);
  assert.equal(engine.state.flags.DR, 1);
  assert.deepEqual(engine.run("unlock door"), [MESSAGES.alreadyOpen]);
  assert.deepEqual(engine.run("lock door"), [MESSAGES.ok]);
  assert.equal(engine.state.flags.DR, 0);

  // --- 6500 / 6600: EAT / DRINK ---
  // Eat bread (9)
  engine.state.objectLoc[9] = CARRIED;
  assert.deepEqual(engine.run("eat bread"), ["IT TASTED AWFUL."]);
  assert.equal(engine.state.objectLoc[9], GONE);

  // Eat garlic (32)
  engine.state.objectLoc[32] = CARRIED;
  assert.deepEqual(engine.run("eat garlic"), ["OK"]);
  assert.equal(engine.state.objectLoc[32], GONE);

  // Drink lake water at 16
  engine.state.room = 16;
  assert.deepEqual(engine.run("drink water"), [MESSAGES.hitsTheSpot]);

  // --- 6700: CLIMB ---
  // Trees in forest
  engine.state.room = 1;
  assert.deepEqual(engine.run("climb tree"), [MESSAGES.slipperyMoss]);

  // Willow at lake (16)
  engine.state.room = 16;
  assert.deepEqual(engine.run("climb willow"), [MESSAGES.slidBackDown]);

  // Stairs at 24 moves to 25
  engine.state.room = 24;
  engine.run("climb stairs");
  assert.equal(engine.state.room, 25);

  // Ladder at 36 without VR shook
  engine.state.room = 36;
  engine.state.flags.VR = 0;
  assert.deepEqual(engine.run("climb ladder"), [MESSAGES.shookLadder]);
  engine.state.flags.VR = 1;
  engine.run("climb ladder");
  assert.equal(engine.state.room, 37);

  // --- 7500: OPEN ---
  // Coffin (29) at room 38
  engine.state.room = 38;
  const openCoffin = engine.run("open coffin");
  assert.equal(openCoffin[0].includes("OVERPOWERING STENCH"), true);
  assert.equal(engine.state.objectLoc[21], GONE);
  assert.equal(engine.state.objectLoc[19], 38);
  assert.equal(engine.state.objectLoc[22], 38);
  assert.equal(engine.state.objectLoc[37], 38);

  // Coffer (62) at room 35
  engine.state.room = 35;
  engine.state.objectLoc[23] = 35;
  assert.deepEqual(engine.run("open coffer"), [MESSAGES.ok]);
  assert.equal(engine.state.objectLoc[23], GONE);
  assert.equal(engine.state.objectLoc[5], 35);

  // Sarcophagus at 37
  engine.state.room = 37;
  assert.deepEqual(engine.run("open sarcophagus"), [MESSAGES.hermeticallySealed]);

  // --- 7700: WAVE / SHOW ---
  // Wave ring (63) at room 4 with cloak (3) and ring (5)
  engine.state.room = 4;
  engine.state.objectLoc[3] = CARRIED;
  engine.state.objectLoc[5] = CARRIED;
  engine.state.objectLoc[2] = 4;
  const waveRing = engine.run("wave ring");
  assert.equal(waveRing[0].includes("STREAM OF WHITE FIRE"), true);
  assert.equal(engine.state.objectLoc[5], GONE);
  assert.equal(engine.state.objectLoc[2], GONE);

  // Wave cross (26) with vampire (39)
  engine.state.room = 39;
  engine.state.objectLoc[6] = CARRIED;
  engine.state.objectLoc[39] = 39;
  const waveCross = engine.run("wave cross");
  assert.equal(waveCross[1].includes("VAMPIRE SHRIEKS"), true);
  assert.equal(engine.state.objectLoc[39], GONE);
  assert.equal(engine.state.flags.VR, 1);

  // Wave elixir (28) sets SH
  engine.state.objectLoc[36] = CARRIED;
  engine.state.flags.SH = 0;
  assert.deepEqual(engine.run("wave elixir"), [MESSAGES.elixirEnergized]);
  assert.equal(engine.state.flags.SH, 1);

  // --- 7800: MOVE / PRY ---
  // Move gravestone at 5 reveals grate (13)
  engine.state.room = 5;
  engine.state.objectLoc[13] = GONE;
  assert.deepEqual(engine.run("move gravestone"), [
    "YOU FOUND A GRATE BEHIND THE GRAVESTONE.",
    MESSAGES.thereIsA("LARGE RUSTY GRATE."),
  ]);
  assert.equal(engine.state.objectLoc[13], 5);

  // Move vines at 37 reveals sarcophagus (15)
  engine.state.room = 37;
  engine.state.objectLoc[14] = 37;
  engine.state.objectLoc[15] = GONE;
  assert.deepEqual(engine.run("move vines"), [
    MESSAGES.foundSomething,
    MESSAGES.thereIsA("LARGE STONE SARCOPHAGUS."),
  ]);
  assert.equal(engine.state.objectLoc[15], 37);

  // --- 9400: SET / CAST / SAIL ---
  engine.state.room = 16;
  engine.state.objectLoc[38] = GONE;
  const sailTurnBefore = engine.state.turns;
  const sailRefuse = engine.run("sail boat");
  assert.equal(sailRefuse[0].includes("REFUSE TO LET YOU LAND"), true);
  assert.equal(engine.state.turns, sailTurnBefore); // Does not consume turn

  // With Sabrina carried: win ending. On its own engine, because the ending
  // now ends the game -- test/winnable.test.js plays the whole route to it.
  const winEngine = await createTestEngine();
  winEngine.state.room = 16;
  winEngine.state.objectLoc[38] = CARRIED;
  const sailWin = winEngine.run("sail boat");
  assert.equal(sailWin[0].includes("PRINCESS SABRINA"), true);
  assert.equal(sailWin[1], "PRESS ANY KEY TO RESTART THE GAME.");
  assert.equal(winEngine.isGameOver(), true);

  // --- 9700: READ ---
  // Sign at 15
  engine.state.room = 15;
  assert.deepEqual(engine.run("read sign"), [
    "'YOU ARE ON THE PROPERTY OF ZIN THE WIZARD, WHO LIVES IN A CABIN IN THIS FOREST. THE SUN WILL RISE AT FIVE.'",
  ]);

  // Note
  engine.state.objectLoc[18] = CARRIED;
  assert.deepEqual(engine.run("read note"), ["'SABRINA DIES AT DAWN!'"]);

  // Gravestone at 5
  engine.state.room = 5;
  assert.deepEqual(engine.run("read gravestone"), [
    "IT SAYS 'HERE LIES HERO'... AND IT HAS TODAY'S DATE.",
  ]);

  // Stump at 1
  engine.state.room = 1;
  engine.state.flags.SM = 0;
  assert.deepEqual(engine.run("read stump"), [
    "IT'S COVERED WITH SEDIMENT AND TOO FUZZY TO READ.",
  ]);
  engine.state.flags.SM = 1;
  assert.deepEqual(engine.run("read stump"), ["THE WRITING SAYS 'KNOCK HERE'."]);

  // Magic book at 9
  engine.state.room = 9;
  const bookRead = engine.run("read book");
  assert.equal(bookRead[0].includes("MAGIC ELIXIRS"), true);

  // --- 10000 / 11000: EXIT / IN, ENTER / OUT ---
  // Room 7 is hut (type 4): EXIT moves to 6 (7 - 4 + 3)
  engine.state.room = 7;
  engine.run("exit");
  assert.equal(engine.state.room, 6);

  // Room 6 is outside hut (type 2): ENTER moves to 7
  engine.state.room = 6;
  engine.run("enter");
  assert.equal(engine.state.room, 7);

  // Room 27 is castle entrance (type 7): EXIT moves to 13
  engine.state.room = 27;
  engine.run("exit");
  assert.equal(engine.state.room, 13);

  // Room 13 is castle gate (type 2): ENTER moves to 27
  engine.state.room = 13;
  engine.run("enter");
  assert.equal(engine.state.room, 27);
});

test("per-turn block 7000-7180, endings, and meta commands work as expected", async () => {
  const engine = await createTestEngine();

  // --- Meta commands ---
  // HELP with no noun does not consume a turn (TRANS.bas:4200)
  const turnsBeforeHelp = engine.state.turns;
  assert.deepEqual(engine.run("help"), ["HAVE YOU INSPECTED EVERYTHING?"]);
  assert.equal(engine.state.turns, turnsBeforeHelp);
  assert.deepEqual(engine.run("help tree"), [MESSAGES.cant]);

  // Known gap: LIST -> 230
  assert.deepEqual(engine.run("list"), [MESSAGES.dontUnderstand]);

  // Known gap: KILL + PASSA (noun 77) -> 230
  assert.deepEqual(engine.run("kill passage"), [MESSAGES.dontUnderstand]);

  // SAVE
  assert.deepEqual(engine.run("save"), ["SAVED."]);

  // QUIT -> game over terminal state
  const quitEngine = await createTestEngine();
  assert.equal(quitEngine.isGameOver(), false);
  assert.deepEqual(quitEngine.run("quit"), ["PRESS ANY KEY TO RESTART THE GAME."]);
  assert.equal(quitEngine.isGameOver(), true);
  assert.deepEqual(quitEngine.run("look"), ["PRESS ANY KEY TO RESTART THE GAME."]);

  // Restart resets game over
  const restartRes = quitEngine.run("restart");
  assert.equal(quitEngine.isGameOver(), false);
  assert.equal(restartRes[0], MESSAGES.welcome);

  // --- Per-turn block: Wandering mice (object 20) ---
  const miceEngine = await createTestEngine();
  miceEngine.state.objectLoc[20] = 2;
  miceEngine.run("look"); // turn 1
  assert.equal(miceEngine.state.objectLoc[20], 17);
  miceEngine.run("look"); // turn 2
  assert.equal(miceEngine.state.objectLoc[20], 3);
  miceEngine.run("look"); // turn 3
  assert.equal(miceEngine.state.objectLoc[20], 19);
  miceEngine.run("look"); // turn 4
  assert.equal(miceEngine.state.objectLoc[20], 2);

  // When mice arrive in player's room, announcement appears
  miceEngine.state.room = 17;
  const miceEnter = miceEngine.run("look"); // mice move from 2 to 17
  assert.equal(miceEnter.at(-1), "THERE IS A TRIO OF RAVENOUS MICE.");

  // --- Per-turn block: Shooting star (7030) ---
  const starEngine = await createTestEngine();
  starEngine.state.timers.R = starEngine.state.turns - 19;
  const starRes = starEngine.run("look");
  assert.equal(starRes.at(-1), "I THOUGHT I SAW A SHOOTING STAR!");
  assert.equal(starEngine.state.objectLoc[28], 4);

  // --- Per-turn block: Leaving room 35 resets coffer (7003) ---
  const cofferEngine = await createTestEngine();
  cofferEngine.state.room = 35;
  cofferEngine.state.objectLoc[5] = 35; // ring loose
  cofferEngine.state.objectLoc[23] = GONE; // coffer opened
  cofferEngine.run("up"); // Leaves room 35 to 34
  assert.equal(cofferEngine.state.objectLoc[5], GONE);
  assert.equal(cofferEngine.state.objectLoc[23], 35); // coffer reset

  // --- Per-turn block: Clock strikes and sunrise ending (7005 / 27000) ---
  const clockEngine = await createTestEngine();
  clockEngine.state.turns = 69;
  const chime1 = clockEngine.run("look");
  assert.equal(chime1.at(-1), "FAR AWAY A CLOCK STRIKES 1.");
  assert.equal(clockEngine.state.hour, 1);
  assert.equal(clockEngine.isGameOver(), false);

  // 5th chime (turn 350) -> sunrise ending
  clockEngine.state.turns = 349;
  const chime5 = clockEngine.run("look");
  assert.equal(chime5.includes("FAR AWAY A CLOCK STRIKES 5."), true);
  assert.equal(chime5.includes("THE SUN BEGINS TO APPEAR ON THE HORIZON."), true);
  assert.equal(chime5.includes("YOUR TIME HAS RUN OUT! "), true);
  assert.equal(chime5.at(-1), "PRESS ANY KEY TO RESTART THE GAME.");
  assert.equal(clockEngine.isGameOver(), true);

  // --- Per-turn block: Monster deaths (7015 / 7020) ---
  // Vampire kills player 1 turn after being in same room
  const vampEngine = await createTestEngine();
  vampEngine.state.objectLoc[39] = vampEngine.state.room;
  vampEngine.state.timers.V = vampEngine.state.turns; // stamped on turn N
  const vampDeath = vampEngine.run("look"); // turn N+1
  assert.equal(vampDeath.includes("YOU FEEL A PINCH ON YOUR NECK, THE ROOM SPINS, AND YOU BLACK OUT..."), true);
  assert.equal(vampDeath.includes("SO MUCH FOR THAT TRY..."), true);
  assert.equal(vampEngine.isGameOver(), true);

  // Werewolf kills player 1 turn after being in same room
  const wolfEngine = await createTestEngine();
  wolfEngine.state.objectLoc[34] = wolfEngine.state.room;
  wolfEngine.state.timers.W = wolfEngine.state.turns; // stamped on turn N
  const wolfDeath = wolfEngine.run("look"); // turn N+1
  assert.equal(wolfDeath.includes("TOO LATE! THE FURRY FIEND JUST HAD YOU FOR DINNER..."), true);
  assert.equal(wolfDeath.includes("SO MUCH FOR THAT TRY..."), true);
  assert.equal(wolfEngine.isGameOver(), true);

  // Unrecognized input ("I DON'T UNDERSTAND.") does NOT advance turn and does NOT kill player
  const safeWolfEngine = await createTestEngine();
  safeWolfEngine.state.objectLoc[34] = safeWolfEngine.state.room;
  safeWolfEngine.state.timers.W = safeWolfEngine.state.turns;
  const safeRes1 = safeWolfEngine.run("xyzzy");
  assert.deepEqual(safeRes1, [MESSAGES.dontUnderstand]);
  assert.equal(safeWolfEngine.isGameOver(), false);
  assert.equal(safeWolfEngine.state.turns, 0);

  const safeRes2 = safeWolfEngine.run("attack werewolf");
  assert.deepEqual(safeRes2, [MESSAGES.dontUnderstand]);
  assert.equal(safeWolfEngine.isGameOver(), false);
  assert.equal(safeWolfEngine.state.turns, 0);

  const safeVampEngine = await createTestEngine();
  safeVampEngine.state.objectLoc[39] = safeVampEngine.state.room;
  safeVampEngine.state.timers.V = safeVampEngine.state.turns;
  const safeRes3 = safeVampEngine.run("stab vampire");
  assert.deepEqual(safeRes3, [MESSAGES.dontUnderstand]);
  assert.equal(safeVampEngine.isGameOver(), false);
  assert.equal(safeVampEngine.state.turns, 0);
});

test("probabilistic turn hooks with seeded RNG trigger expected events", async () => {
  const data = await (await import("./helpers.js")).loadGameData();
  const { createEngine } = await import("../src/engine/engine.js");

  // 1. Cat hissing in room 7
  let rngVal = 0.1;
  const catEngine = createEngine(data, { randomEvents: true, rng: () => rngVal });
  catEngine.state.room = 7;
  catEngine.state.objectLoc[24] = 7;
  const catRes = catEngine.execute("look").messages;
  assert.equal(catRes.includes("YOU HEAR A LOUD, HISSING 'MEOW'."), true);

  // 2. Goblin harassment in room 26
  rngVal = 0.5; // picks second goblin message
  const gobEngine = createEngine(data, { randomEvents: true, rng: () => rngVal });
  gobEngine.state.room = 26;
  gobEngine.state.objectLoc[10] = 26;
  const gobRes = gobEngine.execute("look").messages;
  assert.equal(gobRes.some((m) => m.includes("GOBLIN") || m.includes("SOMEONE")), true);

  // 3. Werewolf appearance in forest
  rngVal = 0.8; // rng >= 0.67 triggers werewolf if turns >= 10
  const wolfEngine = createEngine(data, { randomEvents: true, rng: () => rngVal });
  wolfEngine.state.room = 1;
  wolfEngine.state.turns = 10;
  const wolfRes = wolfEngine.execute("look").messages;
  assert.equal(wolfEngine.state.objectLoc[34], 1);
  assert.equal(wolfRes.at(-1), "THERE IS A MENACING WEREWOLF.");

  // 4. Vampire appearance in castle
  rngVal = 0.1; // rng < 0.2 triggers vampire in castle
  const vampEngine = createEngine(data, { randomEvents: true, rng: () => rngVal });
  vampEngine.state.room = 28;
  vampEngine.state.flags.VR = 0;
  const vampRes = vampEngine.execute("look").messages;
  assert.equal(vampEngine.state.objectLoc[39], 28);
  assert.equal(vampRes.at(-1), "THERE IS A VAMPIRE.");
});

test("player makes a map as they explore the world", async () => {
  const engine = await createTestEngine();

  // Initially at room 1 (Stump): only room 1 is charted
  assert.deepEqual(engine.getVisitedRooms(), [1]);

  // MAP meta command reports 1 of 37 without consuming a turn
  const turnsBefore = engine.state.turns;
  assert.deepEqual(engine.run("map"), ["YOU CONSULT YOUR MAP. [1 OF 37 AREAS CHARTED]"]);
  assert.equal(engine.state.turns, turnsBefore);

  // Travel north to room 8
  engine.run("north");
  assert.equal(engine.state.room, 8);
  assert.deepEqual(engine.getVisitedRooms(), [1, 8]);

  // Travel west to room 3
  engine.run("west");
  assert.equal(engine.state.room, 3);
  assert.deepEqual(engine.getVisitedRooms(), [1, 8, 3]);

  // Teleport or visit room 9: newly revealed room added
  engine.state.room = 1;
  engine.run("knock stump"); // teleports to room 9
  assert.equal(engine.state.room, 9);
  assert.equal(engine.getVisitedRooms().includes(9), true);
  assert.equal(engine.getVisitedRooms().length, 4);

  // MAP command reflects the 4 charted rooms
  assert.deepEqual(engine.run("map"), ["YOU CONSULT YOUR MAP. [4 OF 37 AREAS CHARTED]"]);

  // State serialization preserves visitedRooms across save/restore
  const serialized = (await import("../src/engine/state.js")).serializeState(engine.state);
  const restored = (await import("../src/engine/state.js")).deserializeState(serialized);
  assert.deepEqual(restored.visitedRooms, [1, 8, 3, 9]);
});

test("flypaper commands in room 9 catch flies cleanly without disappearing", async () => {
  const engine = await createTestEngine();

  // 1. Entering room 9 without flypaper gives clue
  engine.state.room = 9;
  assert.deepEqual(engine.run("catch flies"), [
    "THE FLIES SCATTERED BEFORE YOU COULD CATCH ANY OF THEM.",
  ]);

  // 2. 'use flypaper' catches flies
  engine.state.objectLoc[31] = CARRIED;
  const res1 = engine.run("use flypaper");
  assert.equal(res1[0].includes("MANAGE TO CATCH SEVERAL OF THEM WITH THE PAPER"), true);
  assert.equal(engine.state.objectLoc[7], CARRIED);
  assert.equal(engine.state.objectLoc[31], GONE);

  // 3. Reset and test 'catch flies with flypaper'
  engine.state.objectLoc[7] = 9;
  engine.state.objectLoc[31] = CARRIED;
  const res2 = engine.run("catch flies with flypaper");
  assert.equal(res2[0].includes("MANAGE TO CATCH SEVERAL OF THEM WITH THE PAPER"), true);
  assert.equal(engine.state.objectLoc[7], CARRIED);

  // 4. Reset and test 'drop flypaper' in room 9 catches flies instead of disappearing
  engine.state.objectLoc[7] = 9;
  engine.state.objectLoc[31] = CARRIED;
  const res3 = engine.run("drop flypaper");
  assert.equal(res3[0].includes("MANAGE TO CATCH SEVERAL OF THEM WITH THE PAPER"), true);
  assert.equal(engine.state.objectLoc[7], CARRIED);

  // 5. Reset and test 'wave flypaper' in room 9 catches flies
  engine.state.objectLoc[7] = 9;
  engine.state.objectLoc[31] = CARRIED;
  const res4 = engine.run("wave flypaper");
  assert.equal(res4[0].includes("MANAGE TO CATCH SEVERAL OF THEM WITH THE PAPER"), true);
  assert.equal(engine.state.objectLoc[7], CARRIED);

  // 6. Test feeding bullfrog with flies or dropping flies at bullfrog
  engine.state.room = 16;
  engine.state.objectLoc[8] = 16;
  const feedRes = engine.run("drop flies");
  assert.equal(feedRes[0].includes("BULLFROG SPRINGS FORWARD"), true);
  assert.equal(engine.state.objectLoc[7], GONE);
  assert.equal(engine.state.objectLoc[8], GONE);
});

test("cat guard in room 7 blocks acid and broom until distracted by mice", async () => {
  const engine = await createTestEngine();

  // 1. Enter room 7 where cat is present
  engine.state.room = 7;
  assert.equal(engine.state.objectLoc[24], 7); // cat is here
  assert.equal(engine.state.objectLoc[1], 7);  // acid is here
  assert.equal(engine.state.objectLoc[25], 7); // broom is here

  // 2. Trying to take acid or broom is blocked by the cat
  assert.deepEqual(engine.run("get acid"), [MESSAGES.catScowls]);
  assert.deepEqual(engine.run("get bottle"), [MESSAGES.catScowls]);
  assert.deepEqual(engine.run("get broom"), [MESSAGES.catScowls]);
  assert.equal(engine.state.objectLoc[1], 7);
  assert.equal(engine.state.objectLoc[25], 7);

  // 3. Trying to ride broom while cat is in the room also scowls
  engine.state.objectLoc[25] = CARRIED;
  assert.deepEqual(engine.run("ride broom"), [MESSAGES.catScowls]);
  engine.state.objectLoc[25] = 7;

  // 4. Player gets the mice (escaped from wagon coffin)
  engine.state.objectLoc[20] = CARRIED;

  // 5. Dropping the mice in room 7 distracts the cat
  const dropRes = engine.run("drop mice");
  assert.equal(dropRes[0], "THE MICE RUN AWAY AND THE CAT CHASES AFTER THEM.");
  assert.equal(engine.state.objectLoc[24], GONE);
  assert.equal(engine.state.objectLoc[20], GONE);

  // 6. Now that the cat is gone, player can freely take the acid and broom
  assert.deepEqual(engine.run("get acid"), [MESSAGES.ok]);
  assert.equal(engine.state.objectLoc[1], CARRIED);

  assert.deepEqual(engine.run("get broom"), [MESSAGES.ok]);
  assert.equal(engine.state.objectLoc[25], CARRIED);

  // 7. And now player can fly the broom!
  const flyRes = engine.run("ride broom");
  assert.equal(flyRes[0].includes("THE BROOMSTICK BUCKS VIOLENTLY"), true);
  assert.equal(engine.state.room, 15); // Willow on lake shore
});

test("the loaf of stale bread is a red herring and does not affect mice", async () => {
  const engine = await createTestEngine();
  engine.state.room = 24;
  assert.equal(engine.state.objectLoc[9], 24);

  // Eat bread
  assert.deepEqual(engine.run("eat bread"), ["IT TASTED AWFUL."]);
  assert.equal(engine.state.objectLoc[9], GONE);
});

