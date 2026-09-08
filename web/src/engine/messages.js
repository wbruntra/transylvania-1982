// Every string the game says, in one place -- the original keeps them as PRINT
// statements at TRANS.bas:200-330, which is why the same sentence appears with
// three different spacings. Centralising them makes the port diffable against
// the listing and, later, translatable.

export const MESSAGES = {
  welcome: "VELCOME TO TRANSYLVANIA! (web port v0.1)",
  exitsPrefix: "OBVIOUS EXITS: ",
  noOrdinaryExits: "(none — special exit, see full TRANS scripts)",
  thereIsA: (name) => `THERE IS A ${name}`,

  ok: "OK.",
  locked: "IT'S LOCKED.", // TRANS.bas:200
  notHere: "NOT HERE.", // TRANS.bas:210
  dontUnderstand: "I'M SORRY - I DON'T UNDERSTAND.", // TRANS.bas:230
  cant: "SORRY - YOU CAN'T.", // TRANS.bas:240
  wontBudge: "IT WON'T BUDGE.", // TRANS.bas:260
  alreadyOpen: "IT'S ALREADY OPEN.", // TRANS.bas:280
  nothingHappened: "NOTHING HAPPENED.", // TRANS.bas:290
  dontHaveIt: "YOU DON'T HAVE IT.", // TRANS.bas:330
  nothingUnusual: "YOU SEE NOTHING UNUSUAL.", // TRANS.bas:1599
  whistleEchoed: "YOUR WHISTLE ECHOED EERILY BACK TO YOU.", // TRANS.bas:9000
  littleCorny: "ISN'T THAT A LITTLE CORNY?", // TRANS.bas:9600
  alreadyCarrying: "YOU ARE ALREADY CARRYING IT!",
  carryingTooMuch: "YOU ARE CARRYING TOO MUCH. BETTER DROP SOMETHING FIRST.", // TRANS.bas:3040
  carryingNothing: "YOU ARE CARRYING NOTHING.",
  carryingHeader: "YOU ARE CARRYING:",
  carriedItem: (name) => `  ${name}`,
  cantGoThatWay: "YOU CAN'T GO IN THAT DIRECTION.",

  // Tier 3 messages
  foundSomething: "YOU FOUND SOMETHING!", // TRANS.bas:300
  slipperyMoss: "SLIPPERY MOSS COVERS THE TREES, MAKING  THEM IMPOSSIBLE TO CLIMB.", // TRANS.bas:310
  slidBackDown: "YOU SLID BACK DOWN AS IF YOU WERE\rPUSHED.", // TRANS.bas:320
  alreadyIs: "IT ALREADY IS.", // TRANS.bas:4502
  pistolEmpty: "CLICK - THE PISTOL IS EMPTY.",
  missed: "MISSED.", // TRANS.bas:4606
  wallSpins: "THE WALL SPINS AND...", // TRANS.bas:4703
  acidSizzlesStump: "THE ACID SIZZLES VIOLENTLY OVER THE WRITING.  YOU CAN READ IT NOW.", // TRANS.bas:4867
  acidSeeps: "SIZZLING SLIGHTLY, THE ACID SEEPS INTO THE GROUND.", // TRANS.bas:4868
  bottleSlipped: "OOPS! THE BOTTLE SLIPPED!SMASH!", // TRANS.bas:6666
  youAlreadyDid: "YOU ALREADY DID!", // TRANS.bas:4815
  lightningInDistance: "YOU SEE LIGHTNING OFF IN THE DISTANCE.", // TRANS.bas:4855
  catScowls: "THE CAT SCOWLS FIERCELY AND WON'T LET YOU NEAR.", // TRANS.bas:3061
  shookLadder: "SOMEONE SHOOK THE LADDER, KNOCKING YOU TO THE FLOOR.", // TRANS.bas:6096
  yecchhh: "YECCHHH!", // TRANS.bas:6510
  poisonousToYou: "TO YOU THAT STUFF IS POISONOUS!", // TRANS.bas:6610
  hitsTheSpot: "AAH! THAT HITS THE SPOT!", // TRANS.bas:6625
  acidBurns: "THE ACID BURNS YOUR MOUTH AND YOU INSTINCTIVELY SPIT IT OUT.", // TRANS.bas:6665
  hermeticallySealed: "GIVE UP-THE SARCOPHAGUS IS HERMETICALLY SEALED.", // TRANS.bas:7510
  boltedDown: "IT SEEMS BOLTED DOWN SOMEHOW.", // TRANS.bas:7515
  itWobbles: "IT WOBBLES.", // TRANS.bas:7805
  needDirection: "I ALSO NEED A DIRECTION.", // TRANS.bas:5700
  tooDangerous: "SORRY...IT'S TOO DANGEROUS.", // TRANS.bas:5740
  whatShallIDo: "WHAT SHALL I DO WITH IT?", // TRANS.bas:5745
  rockSlideImpenetrable: "THE ROCK SLIDE IS IMPENETRABLE.", // TRANS.bas:5770
  areYouCrazy: "ARE YOU CRAZY?!", // TRANS.bas:5800

  help:
    "TRY: NORTH/SOUTH/EAST/WEST/UP/DOWN, LOOK, GET <name>, DROP <name>, INVENTORY. " +
    "Full 89-verb scripts from TRANS.bas:1165/1167 are TODO.",
  quit: "Refresh to restart. Save = localStorage (TODO).",
};
