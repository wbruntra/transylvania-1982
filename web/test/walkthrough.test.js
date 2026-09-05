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

test("the carry limit is five things", async () => {
  const engine = await createTestEngine();

  // Pile the first six takeable objects into the starting room.
  const takeable = [...engine.world.objects.values()].filter((object) => object.takeable);
  const names = takeable.slice(0, MAX_CARRIED + 1).map((object) => object.name);
  for (const object of takeable.slice(0, MAX_CARRIED + 1)) {
    engine.state.objectLoc[object.id] = engine.state.room;
  }

  for (const name of names.slice(0, MAX_CARRIED)) {
    assert.deepEqual(engine.run(`get ${name}`), [MESSAGES.ok]);
  }
  assert.equal(carriedCount(engine.state), MAX_CARRIED);
  assert.deepEqual(engine.run(`get ${names[MAX_CARRIED]}`), [MESSAGES.carryingTooMuch]);

  // Dropping something makes room again.
  engine.run(`drop ${names[0]}`);
  assert.deepEqual(engine.run(`get ${names[MAX_CARRIED]}`), [MESSAGES.ok]);
});

test("unknown input is refused without costing anything but a turn", async () => {
  const engine = await createTestEngine();

  assert.deepEqual(engine.run("xyzzy"), [MESSAGES.dontUnderstand]);
  assert.deepEqual(engine.run("get"), [MESSAGES.dontUnderstand]);
  assert.deepEqual(engine.run("go"), [MESSAGES.dontUnderstand]);
  assert.equal(engine.state.room, START_ROOM);
  assert.equal(engine.state.turns, 3);
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

  // Each command consumed a turn (23 commands executed above)
  assert.equal(engine.state.turns, 23);
});

test("tier 2 routines and rules work as expected", async () => {
  const engine = await createTestEngine();

  // 1. STRIKE/KNOCK/HIT (TRANS.bas:9820)
  assert.equal(engine.state.room, START_ROOM);
  assert.deepEqual(engine.run("knock stump"), ["POOF!"]);
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
    MESSAGES.ok,
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
  assert.deepEqual(engine.run("wave elixir"), [MESSAGES.ok]);
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

  // With Sabrina carried: win ending
  engine.state.objectLoc[38] = CARRIED;
  const sailWin = engine.run("sail boat");
  assert.equal(sailWin[0].includes("PRINCESS SABRINA"), true);
  assert.equal(sailWin[1], "PRESS ANY KEY TO RESTART THE GAME.");

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


