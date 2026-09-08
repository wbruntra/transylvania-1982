(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=[`rooms`,`objects`,`verbs`,`nouns`,`noun_map_N`,`verb_targets`,`counts`];function t(t){if(typeof t!=`object`||!t)throw TypeError(`game data must be an object`);let n=e.filter(e=>!(e in t));if(n.length>0)throw Error(`game data is missing ${n.join(`, `)} -- regenerate it with 'node tools/sync-data.mjs'`);let{rooms:r,objects:i,counts:a}=t;if(r.length!==a.LZ)throw Error(`game data declares ${a.LZ} rooms but contains ${r.length}`);if(i.length!==a.M)throw Error(`game data declares ${a.M} objects but contains ${i.length}`);return t}async function n(e=`game.json`){let n=await fetch(e);if(!n.ok)throw Error(`could not load ${e}: ${n.status} ${n.statusText}`);return t(await n.json())}var r=[`N`,`S`,`W`,`E`,`U`,`D`],i={N:[`n`,`north`],S:[`s`,`south`],W:[`w`,`west`],E:[`e`,`east`],U:[`u`,`up`],D:[`d`,`down`]},a={welcome:`VELCOME TO TRANSYLVANIA! (web port v0.1)`,exitsPrefix:`OBVIOUS EXITS: `,noOrdinaryExits:`(none — special exit, see full TRANS scripts)`,thereIsA:e=>`THERE IS A ${e}`,ok:`OK.`,locked:`IT'S LOCKED.`,notHere:`NOT HERE.`,dontUnderstand:`I'M SORRY - I DON'T UNDERSTAND.`,cant:`SORRY - YOU CAN'T.`,wontBudge:`IT WON'T BUDGE.`,alreadyOpen:`IT'S ALREADY OPEN.`,nothingHappened:`NOTHING HAPPENED.`,dontHaveIt:`YOU DON'T HAVE IT.`,nothingUnusual:`YOU SEE NOTHING UNUSUAL.`,whistleEchoed:`YOUR WHISTLE ECHOED EERILY BACK TO YOU.`,littleCorny:`ISN'T THAT A LITTLE CORNY?`,alreadyCarrying:`YOU ARE ALREADY CARRYING IT!`,carryingTooMuch:`YOU ARE CARRYING TOO MUCH. BETTER DROP SOMETHING FIRST.`,carryingNothing:`YOU ARE CARRYING NOTHING.`,carryingHeader:`YOU ARE CARRYING:`,carriedItem:e=>`  ${e}`,cantGoThatWay:`YOU CAN'T GO IN THAT DIRECTION.`,foundSomething:`YOU FOUND SOMETHING!`,slipperyMoss:`SLIPPERY MOSS COVERS THE TREES, MAKING  THEM IMPOSSIBLE TO CLIMB.`,slidBackDown:`YOU SLID BACK DOWN AS IF YOU WERE\rPUSHED.`,alreadyIs:`IT ALREADY IS.`,missed:`MISSED.`,wallSpins:`THE WALL SPINS AND...`,acidSizzlesStump:`THE ACID SIZZLES VIOLENTLY OVER THE WRITING.  YOU CAN READ IT NOW.`,acidSeeps:`SIZZLING SLIGHTLY, THE ACID SEEPS INTO THE GROUND.`,bottleSlipped:`OOPS! THE BOTTLE SLIPPED!SMASH!`,youAlreadyDid:`YOU ALREADY DID!`,lightningInDistance:`YOU SEE LIGHTNING OFF IN THE DISTANCE.`,catScowls:`THE CAT SCOWLS FIERCELY AND WON'T LET YOU NEAR.`,shookLadder:`SOMEONE SHOOK THE LADDER, KNOCKING YOU TO THE FLOOR.`,yecchhh:`YECCHHH!`,poisonousToYou:`TO YOU THAT STUFF IS POISONOUS!`,hitsTheSpot:`AAH! THAT HITS THE SPOT!`,acidBurns:`THE ACID BURNS YOUR MOUTH AND YOU INSTINCTIVELY SPIT IT OUT.`,hermeticallySealed:`GIVE UP-THE SARCOPHAGUS IS HERMETICALLY SEALED.`,boltedDown:`IT SEEMS BOLTED DOWN SOMEHOW.`,itWobbles:`IT WOBBLES.`,needDirection:`I ALSO NEED A DIRECTION.`,tooDangerous:`SORRY...IT'S TOO DANGEROUS.`,whatShallIDo:`WHAT SHALL I DO WITH IT?`,rockSlideImpenetrable:`THE ROCK SLIDE IS IMPENETRABLE.`,areYouCrazy:`ARE YOU CRAZY?!`,help:`TRY: NORTH/SOUTH/EAST/WEST/UP/DOWN, LOOK, GET <name>, DROP <name>, INVENTORY. Full 89-verb scripts from TRANS.bas:1165/1167 are TODO.`,quit:`Refresh to restart. Save = localStorage (TODO).`};function o(){return{SM:0,GT:0,SH:0,PO:0,GN:0,DR:0,VR:0,WF:0,ZZ:10,YN:``}}function s(){return{V:-1,W:-1,R:-21}}var c=[17,22,6,36,27];function l(e,t={}){let n={},r=e?.objects instanceof Map?e.objects.values():e?.objects??[];for(let e of r)n[e.id]=e.loc;if(t.debugInventory)for(let e of c)n[e]=-2;return{room:1,turns:0,hour:12,objectLoc:n,objectNames:{},objectTakeable:{},nounMapOverrides:{},flags:o(),timers:s(),visitedRooms:[1],isGameOver:!1,isDead:!1}}function u(e,t){return e.objectLoc[t]===-2}function d(e,t,n){e.objectLoc[t]=n}function f(e,t,n){return t?.objectNames?.[n]??e.object(n).name}function p(e,t,n){e.objectNames||={},e.objectNames[t]=n}function m(e,t,n){return t?.objectTakeable&&t.objectTakeable[n]!==void 0?!!t.objectTakeable[n]:!!e.object(n).takeable}function h(e,t,n){e.objectTakeable||={},e.objectTakeable[t]=+!!n}function g(e,t,n){return t?.nounMapOverrides&&t.nounMapOverrides[n]!==void 0?t.nounMapOverrides[n]:e.nounMap?e.nounMap[n-1]??0:0}function _(e,t,n){e.nounMapOverrides||={},e.nounMapOverrides[t]=n}function v(e){return JSON.stringify(e)}function y(e){let t=JSON.parse(e);return{...t,objectNames:{...t.objectNames},objectTakeable:{...t.objectTakeable},nounMapOverrides:{...t.nounMapOverrides},flags:{...o(),...t.flags},timers:{...s(),...t.timers},visitedRooms:Array.isArray(t.visitedRooms)?[...t.visitedRooms]:[t.room??1],isGameOver:!!t.isGameOver,isDead:!!t.isDead}}function b(e,t){let n=t.room;return n===24?(t.room=25,[]):n===25||n===35?(t.room=n-1,[]):n===30?(t.room=36,[]):n===36?(t.room=30,[]):[a.notHere]}function x(e,t){return t.room===36?t.flags.VR?(t.room=37,[]):[a.shookLadder]:[a.cant]}function S(e,t){return t.room!==37||t.objectLoc[14]!==37?[a.dontUnderstand]:(d(t,15,37),[a.foundSomething,a.thereIsA(f(e,t,15))])}function C(e,t){return d(t,5,-1),d(t,2,-1),t.timers.R=t.turns,[`A STREAM OF WHITE FIRE SHOOTS FROM YOUR RING ONTO THE STATUE. GREEN AND WHITE FLAMES BURN QUICKLY, ENGULFING ALL THAT`,`IS AROUND YOU. SUDDENLY, A RED FIREBALL EMERGES, QUELLING THE WHITE AND GREEN FLAMES IN ITS FURY. THE AWKWARD`,`SILHOUETTE OF AN ALIEN CREATURE APPEARS IN FRONT OF THE FIREBALL. IT STEPS FORWARD INTO THE RETURNING DARKNESS.`,`'WELL MET, SIR! YOU HAVE FREED ME FROM MY ACCURSED PRISON! I AM DEEPLY INDEBTED TO YOU!' THE CREATURE GRASPS THE RING`,`AND CRUSHES IT. THERE IS A VIOLENT EXPLOSION. WHEN THE SMOKE CLEARS, STATUE AND ALIEN ARE NOWHERE TO BE SEEN.`]}function w(e,t){let n=[`A STREAM OF BLINDING LIGHT ESCAPES FROM THE CROSS.`];return t.objectLoc[39]===t.room&&(n.push(`THE VAMPIRE SHRIEKS AND DISINTEGRATES INTO A PILE OF BURNING DUST.`),d(t,39,-1),t.flags.VR=1),n}function T(){return{messages:[`SPINNING, YOU SEE MULTITUDES OF PENGUINS FEVERISHLY BAKING CHERRY PIES. ONE ASKS IF YOU'VE PLAYED 'PIE-MAN'.`,`SUDDENLY, YOU'RE BACK IN THE CELLAR.`],consumeTurn:!1}}function E(e,t,n){return n===57?b(e,t):n===99?[a.tooDangerous]:n===56&&t.room===16?{messages:[a.whatShallIDo],consumeTurn:!1}:n===12&&t.room===16?[a.slidBackDown]:n===13?[a.slipperyMoss]:n===19?[a.rockSlideImpenetrable]:n===20&&t.room===6?(t.room=7,[]):n===27?t.flags.GT?(t.room=11,[]):[a.locked]:n===29?[a.areYouCrazy]:n===37&&t.room===2?(t.room=38,[]):n===38&&t.room===23?(t.room=24,[]):n===39&&t.room===19?(t.room=21,[]):n===40&&t.room===19?(t.room=20,[]):n===54&&t.room===13?(t.room=27,[]):n===73&&t.objectLoc[28]===t.room?(d(t,28,-1),d(t,29,4),d(t,27,-2),[`FANTASTIC! UTTERLY FASCINATING!..OH NO! ...EVERYTHING IS GETTING BLACK--HELP!!`]):n===59&&t.room===36?x(e,t):n===60&&t.room===31?T():n===61?t.room===31?T():t.room!==9&&t.room!==10?[a.needDirection]:t.flags.DR?(t.room=t.room===9?10:9,[]):[a.locked]:null}function D({world:e,state:t,command:n}){return n.X===12&&t.room===16?[a.slidBackDown]:n.X===57?b(e,t):n.X===59?x(e,t):n.X===13?t.room===16?[a.slidBackDown]:[a.slipperyMoss]:[a.cant]}function O({world:e,state:t,command:n}){return n.X===29?(e.nounMap&&(e.nounMap[28]=21,e.nounMap[33]=21),d(t,37,-1),d(t,21,38),d(t,19,-1),t.objectLoc[22]===38&&d(t,22,-1),[a.ok]):[a.cant]}function k(e){let t=new Map(e.rooms.map(e=>[e.id,e])),n=new Map(e.objects.map(e=>[e.id,e]));return{rooms:t,objects:n,verbs:e.verbs,nouns:e.nouns,nounMap:[...e.noun_map_N],verbTargets:e.verb_targets,room(e){let n=t.get(e);if(!n)throw Error(`no such room: ${e}`);return n},object(e){let t=n.get(e);if(!t)throw Error(`no such object: ${e}`);return t},exitsFrom(e){let{exits:t}=this.room(e);return r.filter(e=>t[e]>0)},destination(e,t){return this.room(e).exits[t]??0}}}function A(e,t,n){return[...e.objects.values()].filter(e=>t.objectLoc[e.id]===n)}function ee(e,t){return[...e.objects.values()].filter(e=>t.objectLoc[e.id]===-2)}function j(e,t,n){let r=n.toLowerCase().trim();return r?[...A(e,t,t.room),...ee(e,t)].find(e=>e.name.toLowerCase().includes(r))??null:null}function M(e,t){return u(t,7)?[a.alreadyCarrying]:t.room!==9||t.objectLoc[7]!==9?[a.notHere]:u(t,31)||t.objectLoc[31]===t.room?(h(t,7,1),p(t,7,`FLIES ON FLYPAPER.`),d(t,7,-2),d(t,31,-1),[`MANY FLIES ESCAPED, BUT YOU DID MANAGE TO CATCH SEVERAL OF THEM WITH THE PAPER.`,a.ok]):[`THE FLIES SCATTERED BEFORE YOU COULD CATCH ANY OF THEM.`]}function te({world:e,state:t,command:n}){if(!n.noun)return null;if(n.X===66)return t.room===9?(t.room=1,[`AS YOU TRY TO TAKE THE BOOK A MYSTERIOUS VOICE SHOUTS 'IT IS MINE! GO AWAY!'...YOU ARE BACK IN THE FOREST.`]):[a.cant];if(n.X===65||n.noun&&n.noun.includes(`flies`))return M(e,t);let r=null;if(n.X){let i=g(e,t,n.X);i>0&&(r=e.objects.get(i))}return r||=j(e,t,n.noun),!r&&n.X?[a.cant]:r?u(t,r.id)?[a.alreadyCarrying]:t.objectLoc[r.id]===t.room?m(e,t,r.id)?t.room===7&&t.objectLoc[24]===7&&(r.id===1||r.id===25||n.X===36||n.X===35||n.X===22||n.noun?.includes(`acid`)||n.noun?.includes(`broom`)||n.noun?.includes(`bottle`))?[a.catScowls]:n.X===63&&!t.flags.VR?[`A MYSTERIOUS BARRIER PREVENTS YOU FROM TOUCHING IT.`]:(d(t,r.id,-2),[a.ok]):[a.cant]:[a.notHere]:[a.notHere]}function ne({world:e,state:t,command:n}){if(!n.noun)return null;if(t.room===9&&t.objectLoc[7]===9&&(n.X===141||n.noun?.includes(`paper`)||n.noun?.includes(`flypaper`)))return M(e,t);if(t.room===7&&t.objectLoc[24]===7&&(n.X===31||n.noun?.includes(`mice`))&&u(t,20))return d(t,20,-1),d(t,24,-1),t.timers||={},t.timers.ZZ=11,[`THE MICE RUN AWAY AND THE CAT CHASES AFTER THEM.`];let r=null;if(n.X){let i=g(e,t,n.X);i>0&&(r=e.objects.get(i))}return r||=j(e,t,n.noun),!r||!u(t,r.id)?[a.dontHaveIt]:(d(t,r.id,t.room),[a.ok])}function re({state:e,command:t}){return t.X===43?e.objectLoc[32]!==e.room&&!u(e,32)?[a.notHere]:(d(e,32,-1),[`OK`]):t.X===41?e.objectLoc[9]!==e.room&&!u(e,9)?[a.notHere]:(d(e,9,-1),[`IT TASTED AWFUL.`]):[a.yecchhh]}function ie({state:e,command:t}){return t.X===117?e.room===16?[a.hitsTheSpot]:[a.cant]:t.X===36?u(e,1)?(d(e,1,-1),[a.acidBurns,a.bottleSlipped]):[a.notHere]:t.X===28?[a.poisonousToYou]:[a.dontUnderstand]}function N({world:e,state:t}){let n=e.room(t.room);return n.type<4?[a.dontUnderstand]:n.type<7?(t.room=t.room-n.type+3,[]):t.room===27?(t.room=13,[]):t.room===36||t.room===11?(t.room-=6,[]):t.room===38?(t.room=2,[]):t.room===15?(t.room=16,[]):t.room===9||t.room===10||t.room===22?[a.cant]:[]}function P(e){let{world:t,state:n,command:r}=e;if(t.room(n.room).type!==2){if(r.X){let e=E(t,n,r.X);if(e!==null)return e}return[a.cant]}return n.room===8?[a.cant]:n.room===23||n.room===6?(n.room+=1,[]):(n.room===13&&(n.room=27),[])}function ae(e,t){let n=e.exitsFrom(t);return n.length===0?a.noOrdinaryExits:n.map(e=>`${e}.`).join(` `)}function F(e,t){return[e.room(t.room).desc,a.exitsPrefix+ae(e,t.room),...A(e,t,t.room).map(n=>a.thereIsA(f(e,t,n.id)))]}var oe=`transylvania_savegame`;function se({command:e}){return!e.X&&!e.noun?{messages:[`HAVE YOU INSPECTED EVERYTHING?`],consumeTurn:!1}:[a.cant]}function ce({state:e}){return e.isGameOver=!0,[`PRESS ANY KEY TO RESTART THE GAME.`]}function le({state:e}){try{typeof localStorage<`u`&&localStorage.setItem(oe,v(e))}catch{}return[`SAVED.`]}function ue({world:e,state:t}){try{if(typeof localStorage<`u`){let n=localStorage.getItem(oe);if(n){let r=y(n);return Object.assign(t,r),[`RESTORED.`,...F(e,t)]}}}catch{}return[`NO SAVED GAME FOUND.`]}function de({state:e}){return{messages:[`YOU CONSULT YOUR MAP. [${e.visitedRooms?e.visitedRooms.length:1} OF 37 AREAS CHARTED]`],consumeTurn:!1}}function fe({world:e,state:t}){let n=ee(e,t);return n.length===0?[a.carryingNothing]:[a.carryingHeader,...n.map(n=>a.carriedItem(f(e,t,n.id)))]}var I=[`A WITCH'S CACKLE CUTS THROUGH THE STILL AIR OF THE NIGHT.`,`A FEW BATS HOVERED OVER YOU FOR A WHILE, BUT FLEW AWAY.`,`YOU HEAR A WOLF HOWL IN THE DISTANCE.`,`YOU HEAR MOANING NOISES IN THE DISTANCE.`,`YOU HEARD SOME RUSTLING NOISES NEARBY.`,`A ROUGH VOICE SHOUTS 'GET OUT!'`,`HOOOO! HOOOO! (WHO?) - JUST AN OWL.`,`A GRIM CHUCKLE ERUPTS BEHIND YOU.`,`A CAT DARTED BY, FOLLOWED BY THREE RAVENOUS-LOOKING MICE.`];function pe(){return Math.floor(Math.random()*7)===0?{messages:[`YOU HEARD NOTHING, WHICH IS ODD IN THIS FOREST.`],consumeTurn:!1}:[I[Math.floor(Math.random()*I.length)]]}function me({state:e,command:t}){return t.X===33?e.flags.GN?[a.alreadyIs]:!u(e,17)||!u(e,22)?[a.cant]:(d(e,22,-1),e.flags.GN=1,p(e,17,`LOADED FLINTLOCK PISTOL.`),[a.ok]):[a.dontUnderstand]}function he({world:e,state:t,command:n}){return n.noun?[a.nothingUnusual]:F(e,t)}function ge(e){let{world:t,state:n,command:r}=e;if(!r.direction){if(!r.X)return{messages:[a.needDirection],consumeTurn:!1};if(r.X===8)return N(e);if(r.X===7)return P(e);let i=E(t,n,r.X);return i===null?null:i}let i=t.destination(n.room,r.direction);return i<=0?[a.cantGoThatWay]:(n.room=i,[])}function L({world:e,state:t,command:n}){return n.X===69?S(e,t):n.X===102&&t.room===21?[a.itWobbles]:n.X!==25||t.room!==5?[a.nothingHappened]:(d(t,13,5),[`YOU FOUND A GRATE BEHIND THE GRAVESTONE.`,a.thereIsA(f(e,t,13))])}function _e({state:e,command:t}){let n=t.X===27||t.directX===27||t.indirectX===27||t.noun?.includes(`grate`),r=t.X===61||t.directX===61||t.indirectX===61||t.noun?.includes(`door`);return n||e.room===5&&!r?e.room===5?e.flags.GT?[a.alreadyOpen]:u(e,11)?(e.flags.GT=1,[a.ok]):[a.cant]:[a.notHere]:r||e.room===9||e.room===10?e.room!==9&&e.room!==10?[a.notHere]:e.flags.DR?[a.alreadyOpen]:t.indirectX===11||t.noun?.includes(`key`)&&!t.noun?.includes(`pick`)?[`THE TINY KEY DOES NOT FIT THIS DOOR. YOU NEED A LOCK PICK.`]:u(e,26)?(e.flags.DR=1,[a.ok]):[a.cant]:[a.cant]}function ve({state:e,command:t}){return t.X===27?e.room===5?e.flags.GT?u(e,11)?(e.flags.GT=0,[a.ok]):[a.cant]:[a.locked]:[a.notHere]:t.X===61?e.room!==9&&e.room!==10?[a.notHere]:e.flags.DR?(e.flags.DR=0,[a.ok]):[a.locked]:[a.cant]}function ye(e){let{state:t,command:n}=e;return n.X===29&&t.room===38?(_(t,29,19),d(t,20,74),d(t,19,38),t.objectLoc[22]===-1&&!t.flags.GN&&d(t,22,38),d(t,37,38),d(t,21,-1),[`AS YOU LIFT THE LID AN OVERPOWERING STENCH HITS YOU...`]):n.X===61?_e(e):n.X===62?t.room===35?t.objectLoc[23]===t.room?(_(t,62,4),d(t,4,t.room),d(t,5,t.room),d(t,23,-1),[a.ok]):[a.alreadyOpen]:[a.notHere]:n.X===70&&t.room===37?[a.hermeticallySealed]:n.X===72?[a.boltedDown]:n.X!==27||t.objectLoc[13]!==t.room?[a.dontUnderstand]:t.flags.GT?[a.alreadyOpen]:[a.locked]}function be(e){let{state:t,command:n}=e;return n.X===121?t.room===9||t.room===10?t.flags.DR?[a.alreadyOpen]:u(t,26)?(t.flags.DR=1,[a.ok]):[a.cant]:[a.cant]:te(e)}function xe({state:e,command:t}){return t.X===36||t.directX===36||t.noun?.includes(`acid`)?u(e,1)?(d(e,1,-1),e.room===1?(e.flags.SM=1,[a.acidSizzlesStump,a.bottleSlipped]):[a.acidSeeps,a.bottleSlipped]):[a.dontUnderstand]:t.X===28||t.directX===28||t.noun?.includes(`elixir`)?e.flags.PO?[a.youAlreadyDid]:u(e,36)?(d(e,36,-1),e.room===37&&(e.objectLoc[16]===37||e.flags.SH)?(e.flags.SH=1,e.flags.PO=1,[a.ok,a.lightningInDistance]):[a.nothingHappened]):[a.dontUnderstand]:[a.dontUnderstand]}function Se({state:e,command:t}){if(t.X!==76)return[a.wontBudge];if(!u(e,27)&&e.objectLoc[27]!==e.room)return[a.notHere];let n=`DAZZLING LIGHT SHOOTS FROM THE BOX AND`;return e.room===9||e.room===10?[n,`CAUSES THE ROOF OF THE CAVE TO COLLAPSE -- CRUSHING YOU INSTANTLY.`,`SO MUCH FOR THAT TRY...`,`PRESS ANY KEY TO RESTART THE GAME.`]:e.objectLoc[15]===e.room?(d(e,15,-1),d(e,16,37),[n,`ENVELOPS THE SARCOPHAGUS. IN A VIOLENT BLAST THE LID FLIES OFF AND EXPLODES IN`,`A CASCADE OF GLOWING DUST.`]):e.room>26&&e.room<38?[n,`SHAKES THE ROOM WITH A FANTASTIC JOLT OF POWER.`]:[n,`UPROOTS A TREE.`]}function Ce({world:e,state:t,command:n}){return n.X===69?S(e,t):n.X!==46&&(t.room!==21&&t.room!==22||n.X!==112)?[a.wontBudge]:t.room!==21&&t.room!==22?[a.notHere]:(t.room=t.room===21?22:21,[a.wallSpins])}function we({state:e,command:t}){return e.room===15&&t.X===11?[`'YOU ARE ON THE PROPERTY OF ZIN THE WIZARD, WHO LIVES IN A CABIN IN THIS FOREST. THE SUN WILL RISE AT FIVE.'`]:t.X===25?e.room===5?[`IT SAYS 'HERE LIES ${e.flags.YN}'... AND IT HAS TODAY'S DATE.`]:[a.cant]:t.X===24&&(e.objectLoc[18]===e.room||u(e,18))?[`'SABRINA DIES AT DAWN!'`]:(t.X===51||t.X===49)&&e.room===1?e.flags.SM?[`THE WRITING SAYS 'KNOCK HERE'.`]:[`IT'S COVERED WITH SEDIMENT AND TOO FUZZY TO READ.`]:t.X===66&&e.room===9?[`ALL THE PAGES HAVE BEEN RIPPED OUT BUT ONE. IT READS 'MAGIC ELIXIRS-MOST TYPES DEAL WITH THE REMOVAL OF SPELLS CAST ON PEOPLE. TO USE AN ELIXIR, SIMPLY WAVE THE CONTAINER TO ENERGIZE THE INGREDIENTS AND POUR CONTENTS ON THE SUBJECT. TO COMPLETE THE SPELL, CLAP YOUR HANDS.`]:[a.cant]}var Te=()=>[a.notHere],Ee=()=>({messages:[a.dontUnderstand],consumeTurn:!1}),R=()=>[a.cant],z=()=>[a.nothingHappened],De=()=>[a.nothingUnusual],Oe=()=>[a.whistleEchoed],ke=()=>[a.littleCorny];function Ae({state:e,command:t}){let n=t.X===82&&t.I===54,r=(t.X===78||t.X===82)&&t.I===35,i=(t.X===56||t.X===82||!t.X)&&(t.I===59||t.I===47);return!(n||r||i)||e.room!==16?[a.dontUnderstand]:u(e,38)?(e.isGameOver=!0,[`AFTER A PRECARIOUS FEW MINUTES, THE JOURNEY GOES SMOOTHLY. A SOMEWHAT TIRED AND BEWILDERED PRINCESS SABRINA GRACIOUSLY THANKS YOU AS YOU RETURN TO HER KINGDOM. THE KING IS SUITABLY IMPRESSED AND ASKS THAT YOU BE SENT TO DEEPEST AFRICA TO SAVE HIS OTHER DAUGHTER. THAT EVENING, YOU SNEAK OUT IN PEASANT DRESS, PLOTTING YOUR RESCUE OF SABRINA FROM THE KING'S CASTLE...WELL DONE!`,`PRESS ANY KEY TO RESTART THE GAME.`]):{messages:[`AFTER A MISERABLE, CHOPPY JOURNEY, THE KING'S GUARDS REFUSE TO LET YOU LAND WITHOUT THE PRINCESS SABRINA! THEY LET YOU CHOOSE BETWEEN THE GUILLOTINE AND SAILING BACK. YOU SAIL BACK.`],consumeTurn:!1}}function je(e){let{world:t,state:n,command:r}=e;return r.X===56?Ae(e):Me(e)}function Me({world:e,state:t,command:n}){return n.X===22?!(u(t,25)||t.objectLoc[25]===t.room)||!m(e,t,25)?[a.notHere]:t.objectLoc[24]===t.room?[a.catScowls]:(d(t,25,-1),t.room=15,[`THE BROOMSTICK BUCKS VIOLENTLY, BUT YOU ARE FINALLY ABLE TO MASTER IT. IT SOARS HIGH OVER THE WOODS, SHOWING YOU THE`,`HILLS OF TRANSYLVANIA BATHED IN A PALE MOONLIGHT. THE BROOM DIVES, CIRCLING TWICE AROUND A GLOOMY CASTLE. TO THE`,`SOUTH YOU SEE A LAKE EXTENDING FAR BEYOND THE FOREST. SUDDENLY THE BROOM`,`PLUNGES TOWARD THE LAKE. YOU ARE SHAKEN`,`LOOSE AND FALL INTO A LARGE WILLOW ON THE SHORE.  THE LAST SOUND YOU HEAR IS THE LOUD, CHILLING CACKLE OF A WITCH!`]):[a.nothingHappened]}function B({state:e,command:t}){if(!e.flags.GN||!u(e,17)||t.I===61&&t.X!==33)return[a.cant];if(t.I===61)return d(e,22,e.room+3),p(e,17,`SMOKING FLINTLOCK PISTOL.`),e.flags.GN=0,[a.missed];let n=t.X===34||t.directX===34||t.indirectX===34||t.noun?.includes(`werewolf`)||t.noun?.includes(`wolf`)||!t.X;return e.objectLoc[34]===e.room&&n?(e.flags.WF=1,d(e,34,-1),p(e,17,`SMOKING FLINTLOCK PISTOL.`),e.flags.GN=0,[`GOT HIM!  WITH A DESPERATE HOWL THE WEREWOLF COLLAPSES. SLOWLY ITS OUTLINE CHANGES TO THAT OF A DECREPIT OLD MAN,`,`THEN CRUMBLES INTO DUST!`]):(d(e,22,e.room+3),p(e,17,`SMOKING FLINTLOCK PISTOL.`),e.flags.GN=0,[a.missed])}function Ne({state:e,command:t}){let n=(t.directNoun||t.noun||``).toLowerCase().trim();return n===`note`?[a.nothingHappened]:!n||n===`it`?{messages:[`YOU TOUCH IT, BUT NOTHING HAPPENS.`],consumeTurn:!1}:t.X===2||n.includes(`statue`)?e.room===4&&u(e,5)?{messages:[`YOU TOUCH THE STATUE, BUT NOTHING HAPPENS. THE SHINY RING ON YOUR FINGER TINGLES WITH A SOFT WARMTH.`],consumeTurn:!1}:{messages:[`YOU TOUCH THE COLD STONE STATUE, BUT NOTHING HAPPENS.`],consumeTurn:!1}:t.X===49||n.includes(`stump`)?{messages:[`YOU TOUCH THE ANCIENT STUMP, BUT NOTHING HAPPENS.`],consumeTurn:!1}:t.X===10||n.includes(`frog`)?{messages:[`YOU REACH OUT TO TOUCH THE BULLFROG, BUT HE HOPS BACK WITH AN IRRITATED CROAK.`],consumeTurn:!1}:t.X===24||n.includes(`cat`)?{messages:[`THE FIERCE BLACK CAT HISSES AND SWATS SHARPLY AT YOUR FINGERS!`],consumeTurn:!1}:t.X===34||n.includes(`werewolf`)||n.includes(`wolf`)?{messages:[`ARE YOU CRAZY? TOUCHING THAT VICIOUS BEAST WILL GET YOUR ARM BITTEN OFF!`],consumeTurn:!1}:t.X===39||n.includes(`vampire`)?{messages:[`YOU SHUDDER AT THE COLD GRAVE-AURA OF THE VAMPIRE AND PULL YOUR HAND BACK!`],consumeTurn:!1}:t.X===10||n.includes(`goblin`)?{messages:[`THE GOBLIN DODGES AWAY WITH A SNEERING LAUGH!`],consumeTurn:!1}:t.X===70||n.includes(`damsel`)||n.includes(`sabrina`)?{messages:[`YOU TOUCH THE PRINCESS, BUT SHE REMAINS IN A DEEP, UNNATURAL SLUMBER.`],consumeTurn:!1}:{messages:[`YOU TOUCH THE ${n.toUpperCase()}, BUT NOTHING HAPPENS.`],consumeTurn:!1}}function V(e){let{world:t,state:n,command:r}=e,i=(e,t)=>{if(r.X===e||r.directX===e||r.indirectX===e)return!0;if(t){let e=t.toLowerCase();if(r.noun?.toLowerCase().includes(e)||r.directNoun?.toLowerCase().includes(e)||r.indirectNoun?.toLowerCase().includes(e))return!0}return!1},o=(r.directNoun||r.noun||``).trim();if(!o)return{messages:[a.dontUnderstand],consumeTurn:!1};if(o.toLowerCase()===`it`)return{messages:[`HOW DO YOU WANT TO USE IT?`],consumeTurn:!1};if(n.room===9&&n.objectLoc[7]===9&&(i(141,`paper`)||i(65,`fly`)))return M(t,n);if(i(63,`ring`)||i(115,`ring`)||n.room===4&&i(2,`statue`))return n.room===4?{messages:[`HOW DO YOU WANT TO USE THE RING ON THE STATUE? (TRY A MORE SPECIFIC GESTURE, LIKE WAVE OR SHOW.)`],consumeTurn:!1}:{messages:[`HOW DO YOU WANT TO USE THE RING?`],consumeTurn:!1};if(i(36,`acid`)||n.room===1&&i(49,`stump`))return n.room===1?{messages:[`HOW DO YOU WANT TO USE THE ACID ON THE STUMP? (TRY A VERB LIKE POUR.)`],consumeTurn:!1}:{messages:[`HOW DO YOU WANT TO USE THE ACID?`],consumeTurn:!1};if(i(65,`fly`)||i(65,`flies`)||n.room===16&&i(10,`frog`))return n.room===16?{messages:[`HOW DO YOU WANT TO USE THE FLIES ON THE BULLFROG? (TRY FEEDING HIM.)`],consumeTurn:!1}:{messages:[`HOW DO YOU WANT TO USE THE FLIES?`],consumeTurn:!1};if(i(20,`mice`)||n.room===7&&i(24,`cat`))return n.room===7?{messages:[`HOW DO YOU WANT TO USE THE MICE ON THE CAT? (TRY RELEASING OR DROPPING THEM.)`],consumeTurn:!1}:{messages:[`HOW DO YOU WANT TO USE THE MICE?`],consumeTurn:!1};if(i(11,`key`))return n.room===9||n.room===10||i(61,`door`)?{messages:[`THE TINY KEY DOES NOT FIT THIS DOOR. YOU NEED A LOCK PICK.`],consumeTurn:!1}:n.room===5||i(27,`grate`)?{messages:[`HOW DO YOU WANT TO USE THE KEY ON THE GRATE? (TRY A VERB LIKE UNLOCK.)`],consumeTurn:!1}:{messages:[`HOW DO YOU WANT TO USE THE KEY?`],consumeTurn:!1};if(i(48,`pick`))return n.room===9||n.room===10||i(61,`door`)?{messages:[`HOW DO YOU WANT TO USE THE LOCK PICK ON THE DOOR? (TRY A VERB LIKE UNLOCK.)`],consumeTurn:!1}:{messages:[`HOW DO YOU WANT TO USE THE LOCK PICK?`],consumeTurn:!1};if(i(26,`cross`))return n.objectLoc[39]===n.room?{messages:[`HOW DO YOU WANT TO USE THE CROSS ON THE VAMPIRE? (TRY WAVING OR DISPLAYING IT.)`],consumeTurn:!1}:{messages:[`HOW DO YOU WANT TO USE THE CROSS?`],consumeTurn:!1};if(i(116,`bullet`))return{messages:[`HOW DO YOU WANT TO USE THE BULLET? (PERHAPS LOAD IT INTO THE PISTOL?)`],consumeTurn:!1};if(i(33,`pistol`)||i(33,`gun`))return n.objectLoc[34]===n.room?{messages:[`HOW DO YOU WANT TO USE THE PISTOL ON THE WEREWOLF? (SHOOT IT!)`],consumeTurn:!1}:{messages:[`HOW DO YOU WANT TO USE THE PISTOL? (LOAD IT, OR SHOOT IT?)`],consumeTurn:!1};if(i(28,`elixir`))return{messages:[`HOW DO YOU WANT TO USE THE ELIXIR? (CHECK THE CRUMPLED NOTE ON MAGIC ELIXIRS FOR THE EXACT RITUAL.)`],consumeTurn:!1};if(i(141,`paper`))return n.room===9?{messages:[`HOW DO YOU WANT TO USE THE FLYPAPER? (TRY CATCHING THE FLIES WITH IT.)`],consumeTurn:!1}:{messages:[`HOW DO YOU WANT TO USE THE FLYPAPER?`],consumeTurn:!1};if(i(47,`cloak`))return{messages:[`HOW DO YOU WANT TO USE THE CLOAK? (TRY WEARING IT.)`],consumeTurn:!1};if(i(48,`broom`))return{messages:[`HOW DO YOU WANT TO USE THE BROOM? (TRY RIDING IT.)`],consumeTurn:!1};let s=r.indirectNoun?` ON THE ${r.indirectNoun.toUpperCase()}`:``;return{messages:[`HOW DO YOU WANT TO USE THE ${o.toUpperCase()}${s}?`],consumeTurn:!1}}function H({world:e,state:t,command:n}){if(t.room===9&&t.objectLoc[7]===9&&(n.X===141||n.X===65||n.noun?.includes(`paper`)||n.noun?.includes(`fly`)))return M(e,t);if((n.X===63||n.X===115||n.directX===63||n.indirectX===63||n.directX===115||n.noun?.includes(`ring`)||t.room===4&&(n.directX===2||n.indirectX===2||n.noun?.includes(`statue`)))&&t.room===4){if(u(t,3)&&u(t,5))return C(e,t);if(u(t,5))return[`THE RING GLOWS BRIEFLY WITH A SOFT WHITE FLAME, BUT NOTHING HAPPENS.`]}return(n.X===26||n.directX===26||n.indirectX===26||n.noun?.includes(`cross`)||!n.X&&t.objectLoc[39]===t.room)&&u(t,6)?w(e,t):n.X===28||n.directX===28||n.noun?.includes(`elixir`)?u(t,36)?(t.flags.SH=1,[a.ok]):[a.notHere]:[a.nothingHappened]}function Pe({world:e,state:t,command:n}){if(!n.noun)return[a.dontUnderstand];let r=n.X&&e.nounMap?e.nounMap[n.X-1]:0;return r?u(t,r)?[a.ok]:[a.dontHaveIt]:[a.cant]}var Fe={go:ge,look:he,inventory:fe,get:te,drop:ne,help:se,map:de,quit:ce,save:le,restore:ue,list:Ee,hunt:Te,hold:Ee,use:V,put:V,break:R,clean:R,scrape:R,brush:R,pet:R,pat:R,kill:({command:e})=>e.X===77?[a.dontUnderstand]:[a.cant],scream:z,sing:z,kick:z,shake:z,sweep:z,dust:z,touch:Ne,turn:De,whistle:Oe,kiss:ke,pick:be,feed:R,wear:Pe,close:O,clap:z,say:()=>[`OKAY.`,a.nothingHappened],strike:({command:e})=>e.X===49?[`HUH?`]:[a.nothingHappened],listen:pe,load:me,shoot:B,fire:B,pull:Ce,pour:xe,push:Se,press:Se,ride:je,fly:Me,unlock:_e,lock:ve,eat:re,drink:ie,climb:D,open:ye,wave:H,show:H,move:L,pry:L,sail:Ae,read:we,exit:N,out:N,enter:P,in:P},U={go:{words:[`go`,`walk`,`run`,`jump`],takesObject:!0},look:{words:[`look`,`l`,`examine`,`exami`,`inspect`,`inspe`,`search`,`searc`],takesObject:!0},inventory:{words:[`inventory`,`i`],takesObject:!1},get:{words:[`get`,`take`,`grab`,`steal`,`catch`,`lift`],takesObject:!0},drop:{words:[`drop`,`release`,`throw`,`leave`,`give`],takesObject:!0},help:{words:[`help`],takesObject:!0},map:{words:[`map`,`m`,`chart`],takesObject:!1},quit:{words:[`quit`,`end`],takesObject:!1},save:{words:[`save`],takesObject:!1},restore:{words:[`restore`],takesObject:!1},list:{words:[`list`],takesObject:!1},hunt:{words:[`hunt`],takesObject:!0},hold:{words:[`hold`],takesObject:!0},use:{words:[`use`],takesObject:!0},put:{words:[`put`,`place`,`insert`,`apply`],takesObject:!0},break:{words:[`break`],takesObject:!0},clean:{words:[`clean`],takesObject:!0},scrape:{words:[`scrape`,`scrap`],takesObject:!0},brush:{words:[`brush`],takesObject:!0},pet:{words:[`pet`],takesObject:!0},pat:{words:[`pat`],takesObject:!0},scream:{words:[`scream`,`screa`],takesObject:!0},sing:{words:[`sing`],takesObject:!0},kick:{words:[`kick`],takesObject:!0},shake:{words:[`shake`],takesObject:!0},sweep:{words:[`sweep`],takesObject:!0},dust:{words:[`dust`],takesObject:!0},touch:{words:[`touch`],takesObject:!0},turn:{words:[`turn`],takesObject:!0},kill:{words:[`kill`],takesObject:!0},whistle:{words:[`whistle`,`whist`],takesObject:!0},kiss:{words:[`kiss`],takesObject:!0},pick:{words:[`pick`],takesObject:!0},feed:{words:[`feed`],takesObject:!0},wear:{words:[`wear`],takesObject:!0},close:{words:[`close`],takesObject:!0},clap:{words:[`clap`],takesObject:!1},say:{words:[`say`,`yell`],takesObject:!0},strike:{words:[`strike`,`strik`,`knock`,`hit`],takesObject:!0},listen:{words:[`listen`,`liste`],takesObject:!1},load:{words:[`load`],takesObject:!0},shoot:{words:[`shoot`],takesObject:!0},fire:{words:[`fire`],takesObject:!0},pull:{words:[`pull`],takesObject:!0},pour:{words:[`pour`,`spill`],takesObject:!0},push:{words:[`push`,`press`],takesObject:!0},ride:{words:[`ride`],takesObject:!0},fly:{words:[`fly`],takesObject:!0},unlock:{words:[`unlock`,`unloc`],takesObject:!0},lock:{words:[`lock`],takesObject:!0},eat:{words:[`eat`],takesObject:!0},drink:{words:[`drink`],takesObject:!0},climb:{words:[`climb`],takesObject:!0},open:{words:[`open`],takesObject:!0},wave:{words:[`wave`,`point`,`aim`],takesObject:!0},show:{words:[`show`],takesObject:!0},move:{words:[`move`,`pry`],takesObject:!0},sail:{words:[`sail`,`set`,`cast`,`row`],takesObject:!0},read:{words:[`read`],takesObject:!0},exit:{words:[`exit`,`out`,`leave`],takesObject:!1},enter:{words:[`enter`,`in`],takesObject:!0}},Ie=new Map(Object.entries(U).flatMap(([e,{words:t}])=>t.map(t=>[t,e]))),Le=new Map(Object.entries(i).flatMap(([e,t])=>t.map(t=>[t,e])));function Re(e){return Ie.get(e)??null}function W(e){return Le.get(e)??null}function ze(e){return U[e]?.takesObject??!1}function G(e,t){if(!e||!t)return!1;let n=e.toUpperCase();return t.length===5?n.length>=5&&n.slice(0,5)===t:n===t}function K(e,t,n=0,r=null){if(!t||!e||!e.nouns)return null;let i=t.toLowerCase().split(/\s+/).map(e=>e.replace(/[^a-z0-9]/g,``)).filter(Boolean);if(i.length===0)return null;let a=null;for(let t=i.length-1;t>=0;t--){let n=i[t],r=e.nouns.findIndex(e=>G(n,e));if(r!==-1){a=r+1;break}}if(a===null){let t=i.join(``),n=e.nouns.findIndex(e=>G(t,e));n!==-1&&(a=n+1)}if(a===null)return null;a===128&&n===5&&(a=25),a===128&&n===37&&(a=70);let o=new Set;for(;a&&!o.has(a);){o.add(a);let t=r?.nounMapOverrides&&r.nounMapOverrides[a]!==void 0?r.nounMapOverrides[a]:e.nounMap?e.nounMap[a-1]:0;if(t<0)a=-t;else break}return a}function Be(e,t,n=``){if(!e||!e.verbs)return null;if(t){let n=e.verbs.findIndex(e=>G(t,e));if(n!==-1)return n+1}let r={go:`GO`,look:`LOOK`,inventory:`INVEN`,help:`HELP`,quit:`QUIT`,get:`GET`,drop:`DROP`,pick:`PICK`,feed:`FEED`,wear:`WEAR`,close:`CLOSE`,clap:`CLAP`,say:`SAY`,strike:`STRIK`,listen:`LISTE`,load:`LOAD`,shoot:`SHOOT`,fire:`FIRE`,pull:`PULL`,pour:`POUR`,push:`PUSH`,press:`PRESS`,ride:`RIDE`,fly:`FLY`,unlock:`UNLOC`,lock:`LOCK`,eat:`EAT`,drink:`DRINK`,climb:`CLIMB`,open:`OPEN`,wave:`WAVE`,show:`SHOW`,move:`MOVE`,sail:`SAIL`,read:`READ`,exit:`EXIT`,enter:`ENTER`,save:`SAVE`,list:`LIST`}[n]||(t?{N:`NORTH`,S:`SOUTH`,W:`WEST`,E:`EAST`,U:`UP`,D:`DOWN`}[t.toUpperCase()]:null);if(r){let t=e.verbs.indexOf(r);if(t!==-1)return t+1}return null}var Ve=new Set([`on`,`onto`,`with`,`at`,`to`,`in`,`into`,`against`,`for`,`under`,`from`]),He=new Set([`at`,`to`,`in`,`into`,`on`,`onto`,`under`,`behind`,`through`,`for`]);function Ue(e,t=null,n=null){let r=e.toLowerCase().trim().replace(/\s+/g,` `);if(!r)return null;let[i,...a]=r.split(` `),o=a.join(` `),s=``,c=null,l=``,u=``,d=null,f=null,p=W(i);if(p&&a.length===0)s=`go`,c=p,l=i,u=i;else{let e=Re(i);if(!e)s=``,l=r,u=r;else if(e===`go`)s=`go`,c=a.length===1?W(a[0]):null,l=o,u=o;else if(s=e,ze(s)&&a.length>0){let e=[...a];e.length>1&&He.has(e[0])&&(e=e.slice(1));let r=-1;for(let t=1;t<e.length-1;t++)if(Ve.has(e[t])){r=t;break}if(r!==-1)u=e.slice(0,r).join(` `),f=e[r],d=e.slice(r+1).join(` `);else if(t&&e.length>=2){for(let r=1;r<e.length;r++){let i=e.slice(0,r).join(` `),a=e.slice(r).join(` `),o=K(t,i,n?.room,n),s=K(t,a,n?.room,n);if(o&&s){u=i,d=a;break}}d||(u=e.join(` `))}else u=e.join(` `);l=u}else l=``,u=``}let m=t?Be(t,i,s):null,h=t?K(t,u,n?.room,n):null,g=d&&t?K(t,d,n?.room,n):null,_={verb:s,I:m,noun:l,X:h===null?g:h,direction:c,input:r};return(f!==null||d!==null)&&(_.prep=f,_.directNoun=u,_.directX=h,_.indirectNoun=d,_.indirectX=g),_}var We=[{when:{verb:`feed`,X:[10,65,141],room:16,objectInRoom:8,objectCarried:7},then:{say:[`THE BULLFROG SPRINGS FORWARD AND WOLFS DOWN THE FLIES. 'THANKS,' HE SAYS, 'THAT HOWLING SURE WHETS YOUR APPETITE. SAY`,`'IJNID' TO THE GOBLIN FOR ME.' HE HOPS INTO THE MURKY WATERS OF THE LAKE AND VANISHES.`],placeObjects:{7:-1,8:-1}},source:`TRANS.bas:4300, 4100`},{when:{verb:`drop`,X:[65,141],room:16,objectInRoom:8,objectCarried:7},then:{say:[`THE BULLFROG SPRINGS FORWARD AND WOLFS DOWN THE FLIES. 'THANKS,' HE SAYS, 'THAT HOWLING SURE WHETS YOUR APPETITE. SAY`,`'IJNID' TO THE GOBLIN FOR ME.' HE HOPS INTO THE MURKY WATERS OF THE LAKE AND VANISHES.`],placeObjects:{7:-1,8:-1}},source:`TRANS.bas:4047, 4100`},{when:{verb:[`drop`,`release`,`feed`,`give`],X:[31,20],room:7,objectInRoom:24,objectCarried:20},then:{say:`THE MICE RUN AWAY AND THE CAT CHASES AFTER THEM.`,placeObjects:{20:-1,24:-1},apply:({state:e})=>{e.timers||={},e.timers.ZZ=11}},source:`TRANS.bas:4190`},{when:{verb:`look`,X:21,room:7,objectInRoom:24},then:{say:`THE FIERCE BLACK CAT SCOWLS SUSPICIOUSLY, GUARDING THE HUT.`},source:`TRANS.bas:1599/3061`},{when:{verb:`clap`,room:37,flags:[`PO`,`SH`]},then:{say:`THE DAMSEL STIRS A LITTLE AND FINALLY AWAKENS.`,placeObjects:{16:-1,38:37},apply:({world:e})=>{e.object(38).takeable=1,e.nounMap&&(e.nounMap[70]=38)}},source:`TRANS.bas:7900, 7915`},{when:{verb:`say`,X:81,room:26,objectInRoom:10},then:{say:[`OKAY.`,`THE GOBLIN DROPS THE KEY AND FLEES SCREAMING INTO THE DARKNESS...`],placeObjects:{10:-1,11:26}},source:`TRANS.bas:8510`},{when:{verb:`strike`,X:49,room:1},then:{say:`POOF!`,goToRoom:9},source:`TRANS.bas:9820`},{when:{verb:`look`,X:10,objectInRoom:8},then:{say:`IT LOOKS RATHER PECKISH.`},source:`TRANS.bas:1500`},{when:{verb:`look`,X:37,room:2},then:{say:`THERE'S AN OLD, WOODEN COFFIN IN IT.`},source:`TRANS.bas:1505`},{when:{verb:`look`,X:30,objectInRoom:37},then:{say:`IT LOOKS BACK.`},source:`TRANS.bas:1507`},{when:{verb:`look`,X:13,maxRoomType:2},then:{say:`SLIPPERY MOSS COVERS THE TREES, MAKING THEM IMPOSSIBLE TO CLIMB.`},source:`TRANS.bas:1510`},{when:{verb:`look`,X:34,objectInRoom:34},then:{say:`HIS HAIR IS PERFECT.`},source:`TRANS.bas:1515`},{when:{verb:`look`,X:52,objectInRoom:10},then:{say:`HE IS AN OBNOXIOUS-LOOKING CREATURE.`},source:`TRANS.bas:1520`},{when:{verb:`look`,X:54},then:{say:`I THOUGHT I SAW A LIGHT FLICKERING IN A HIGH TOWER ROOM.`},source:`TRANS.bas:1525`},{when:{verb:`look`,X:66,objectInRoom:33},then:{say:`IT'S ENTITLED 'THE JOY OF MAGIC'.`},source:`TRANS.bas:1530`},{when:{verb:`look`,X:71,objectInRoom:16},then:{say:`SUDDENLY YOUR MISSION SEEMS MUCH MORE WORTHWHILE...`},source:`TRANS.bas:1535`},{when:{verb:`look`,X:71,objectInRoom:38},then:{say:`SUDDENLY YOUR MISSION SEEMS MUCH MORE WORTHWHILE...`},source:`TRANS.bas:1535`},{when:{verb:`look`,X:72,room:[24,25]},then:{say:`IN THE DISTANCE YOU SEE A CASTLE WITH A SKULL CHISELED IN ITS SIDE.`},source:`TRANS.bas:1536`},{when:{verb:`look`,X:75,objectCarried:27},then:{say:`THERE IS A BUTTON ON ITS SMOOTH BLACK SURFACE.`},source:`TRANS.bas:1540`},{when:{verb:`look`,X:16,objectInRoom:2},then:{say:`A QUIVERING, MUFFLED VOICE WITHIN THE STATUE CRIES 'HELP!'`},source:`TRANS.bas:1545`},{when:{verb:`look`,X:27,objectInRoom:13,notFlag:`GT`},then:{say:`IT'S LOCKED.`},source:`TRANS.bas:1550`},{when:{verb:`look`,X:25,room:5},then:{say:({state:e})=>`IT SAYS 'HERE LIES ${e.flags.YN||`YOU`}'... AND IT HAS TODAY'S DATE.`},source:`TRANS.bas:1555`},{when:{verb:`look`,X:47,objectPresent:3,objectLocEquals:{26:-1}},then:{say:`YOU FOUND A LOCK PICK IN THE FOLDS OF THE CLOAK'S FABRIC.`,apply:({state:e})=>{d(e,26,e.room)}},source:`TRANS.bas:1560, 1720`},{when:{verb:`look`,X:47,objectPresent:3},then:{say:`IT IS COVERED WITH SHINY RUNES AND STARS.`},source:`TRANS.bas:1560, 1700`},{when:{verb:`look`,X:67,room:10},then:{say:[`AS YOU GAZE INTO THE CRYSTAL BALL YOU SEE A SMALL ORANGE FLAME BURNING WITH AN UNNATURAL BRILLIANCE. AS YOU PEER`,`DEEPER INTO THE FIRE, YOU SEE YOURSELF STANDING SOMEWHERE IN THE WOODS, NEAR A STATUE. A FIGURE CLAD IN A WIZARD'S`,`CLOAK APPROACHES THE STATUE. ON HIS HAND HE WEARS A SHINY GOLD RING WHICH GLOWS WITH A SOFT, WHITE FLAME. WITH A WAVE`,`OF HIS HAND, EVERYTHING AROUND THE STATUE GOES ABLAZE WITH BRIGHT GREEN FIRE. YOU FEEL A JOLT OF THUNDER AND`,`RETURN TO YOUR SENSES, STEPPING AWAY FROM THE CRYSTAL BALL.`]},source:`TRANS.bas:1780, 1785-1787`},{when:{verb:`look`,X:67},then:{say:a.notHere},source:`TRANS.bas:1780`},{when:{verb:`look`,X:61,room:31},then:{say:`IT'S GLOWING RED HOT.`},source:`TRANS.bas:1562, 1755`},{when:{verb:`look`,X:61,room:[9,10],flag:`DR`},then:{say:`IT'S ALREADY OPEN.`},source:`TRANS.bas:1562, 1765`},{when:{verb:`look`,X:61,room:[9,10],notFlag:`DR`},then:{say:`IT'S LOCKED.`},source:`TRANS.bas:1562, 1770`}];function Ge({when:e},{world:t,state:n,command:r}){if(e.verb!==void 0&&!(Array.isArray(e.verb)?e.verb:[e.verb]).includes(r.verb))return!1;let i=r.I??(t?Be(t,r.input.split(` `)[0],r.verb):null);if(e.I!==void 0&&e.I!==i||e.room!==void 0&&!(Array.isArray(e.room)?e.room:[e.room]).includes(n.room)||e.maxRoomType!==void 0&&t&&t.room(n.room).type>e.maxRoomType)return!1;if(e.X!==void 0){let i=Array.isArray(e.X)?e.X:[e.X],a=[r.X,r.directX,r.indirectX].filter(e=>e!=null);if(a.length===0&&t&&r.noun){let e=K(t,r.noun,n?.room);e&&a.push(e)}if(!a.some(e=>i.includes(e)))return!1}if(e.noun!==void 0&&!r.noun.toLowerCase().includes(e.noun.toLowerCase())||e.objectInRoom!==void 0&&!A(t,n,n.room).some(t=>t.id===e.objectInRoom)||e.objectCarried!==void 0&&!u(n,e.objectCarried)||e.objectPresent!==void 0&&!(A(t,n,n.room).some(t=>t.id===e.objectPresent)||u(n,e.objectPresent)))return!1;if(e.objectLocEquals!==void 0){for(let[t,r]of Object.entries(e.objectLocEquals))if(n.objectLoc[Number(t)]!==r)return!1}return!(e.flag!==void 0&&!n.flags[e.flag]||e.flags!==void 0&&!e.flags.every(e=>n.flags[e])||e.notFlag!==void 0&&n.flags[e.notFlag])}function Ke({then:e},t){let{state:n}=t;if(e.setFlags&&Object.assign(n.flags,e.setFlags),e.placeObjects)for(let[t,r]of Object.entries(e.placeObjects))d(n,Number(t),r);if(e.goToRoom!==void 0&&(n.room=e.goToRoom),typeof e.apply==`function`&&e.apply(t),!e.say)return[];let r=typeof e.say==`function`?e.say(t):e.say;return Array.isArray(r)?r:[r]}function qe(e,t=We){let n=t.find(t=>Ge(t,e));return n?Ke(n,e):null}function Je({world:e,state:t,randomEvents:n=!1,rng:r=Math.random}){return function(){if(t.isGameOver)return[];let i=[];if(t.objectLoc[39]!==t.room&&(t.timers.V=-1),t.objectLoc[34]!==t.room&&(t.timers.W=-1),t.room!==35&&t.objectLoc[5]===35&&(t.objectLoc[5]=-1,_(t,62,23),t.objectLoc[4]=-1,t.objectLoc[23]=35),t.turns>0&&t.turns%70==0){let n=Math.floor(t.turns/70);if(t.hour=n,i.push(`FAR AWAY A CLOCK STRIKES ${n}.`),n>=5){i.push(`THE SUN BEGINS TO APPEAR ON THE HORIZON.`),i.push(`YOUR TIME HAS RUN OUT! `);let n=g(e,t,71)||16;return t.objectLoc[n]===t.room||u(t,n)?i.push(`SUDDENLY SOMETHING HITS YOU. YOU AWAKEN WITH A DULL ACHE IN THE BACK OF YOUR HEAD, AND TURN TO FIND THE LIFELESS BODY OF PRINCESS SABRINA LYING IN A POOL OF BLOOD!`):i.push(`YOU HEAR A TERRORFILLED SCREAM. RUNNING TO WHERE IT HAS COME FROM YOU FIND THE LIFELESS BODY OF PRINCESS SABRINA LYING IN A POOL OF BLOOD!`),i.push(`PRESS ANY KEY TO RESTART THE GAME.`),t.isGameOver=!0,i}}if(t.timers.V!==-1&&t.turns-t.timers.V===1)return i.push(`YOU FEEL A PINCH ON YOUR NECK, THE ROOM SPINS, AND YOU BLACK OUT...`),i.push(`SO MUCH FOR THAT TRY...`),i.push(`PRESS ANY KEY TO RESTART THE GAME.`),t.isGameOver=!0,t.isDead=!0,i;if(t.timers.W!==-1&&t.turns-t.timers.W===1)return i.push(`TOO LATE! THE FURRY FIEND JUST HAD YOU FOR DINNER...`),i.push(`SO MUCH FOR THAT TRY...`),i.push(`PRESS ANY KEY TO RESTART THE GAME.`),t.isGameOver=!0,t.isDead=!0,i;if(t.objectLoc[20]>=1){let n=t.objectLoc[20];n===2?n=17:n===17?n=3:n===3?n=19:n===19?n=2:(n===38||n===74)&&(n-=36),t.objectLoc[20]=n,n===t.room&&i.push(`THERE IS A ${f(e,t,20)}`)}if(t.turns-t.timers.R===20&&(i.push(`I THOUGHT I SAW A SHOOTING STAR!`),d(t,28,4)),!n)return i;if(t.objectLoc[39]!==t.room&&t.objectLoc[34]!==t.room){if(t.room===7&&t.objectLoc[24]===7&&r()<.5)return i.push(`YOU HEAR A LOUD, HISSING 'MEOW'.`),i;if(t.room===26&&t.objectLoc[10]===26){let e=[`SOMEONE JUST GAVE YOU A HOTFOOT! AAAAH!`,`SOMEONE JUST DUMPED WATER ON YOU!`,`THE GOBLIN JUST GAVE YOU A JUICY BRONX CHEER!`,`SOMEONE JUST SET YOUR HAIR ON FIRE! YOU WERE ABLE TO PUT IT OUT, THOUGH.`];return i.push(e[Math.floor(r()*e.length)]),i}if(t.room>26&&t.room<38&&!u(t,32)&&!t.flags.VR&&r()<.2)return t.objectLoc[39]=t.room,t.timers.V=t.turns,i.push(`THERE IS A ${f(e,t,39)}`),i;if(!t.flags.WF&&t.turns>=10&&r()>=.67&&![9,10,15,22,26].includes(t.room))return t.objectLoc[34]=t.room,t.timers.W=t.turns,i.push(`THERE IS A ${f(e,t,34)}`),i}if(r()<=.2){let n=Math.floor(r()*11)+1;if(n===1)i.push(`A WITCH'S CACKLE CUTS THROUGH THE STILL AIR OF THE NIGHT.`);else if(n===2)i.push(`A FEW BATS HOVERED OVER YOU FOR A WHILE, BUT FLEW AWAY.`);else if(n===3)i.push(`YOU HEAR A WOLF HOWL IN THE DISTANCE.`);else if(n===4)i.push(`YOU HEAR MOANING NOISES IN THE DISTANCE.`);else if(n===5)i.push(`A STRANGE, GHOSTLY SHAPE JUST FLOATED PAST MOURNFULLY CRYING '${t.flags.YN}, ${t.flags.YN}...'`);else if(n===6)i.push(`YOU HEARD SOME RUSTLING NOISES NEARBY.`);else if(n===7)i.push(`A ROUGH VOICE SHOUTS 'GET OUT!'`);else if(n===8)i.push(`HOOOO! HOOOO! (WHO?) - JUST AN OWL.`);else if(n===9)i.push(`A GRIM CHUCKLE ERUPTS BEHIND YOU.`);else if(n===10){if(e.room(t.room).type<=2){i.push(`A GIANT EAGLE SWOOPS DOWN ON YOU, GRASPS YOU IN ITS TALONS, AND TAKES YOU TO ANOTHER PART OF THE FOREST.`);let n=t.room;for(let i=0;i<50;i++){let i=Math.floor(r()*23)+1;if(e.room(i).type<=2&&i!==t.room){n=i;break}}t.room=n,t.objectLoc[34]=-1}}else n===11&&i.push(`A CAT DARTED BY, FOLLOWED BY THREE RAVENOUS-LOOKING MICE.`)}return i}}function Ye(e,n={}){let r=k(t(e)),i=n.state??l(r,{debugInventory:n.debugInventory}),o=[Je({world:r,state:i,randomEvents:n.randomEvents??!1,rng:n.rng??Math.random})];return{world:r,state:i,addTurnHook(e){o.push(e)},isGameOver(){return!!i.isGameOver},start(){return i.visitedRooms||=[],i.visitedRooms.includes(i.room)||i.visitedRooms.push(i.room),[a.welcome,...F(r,i)]},getVisitedRooms(){return i.visitedRooms||=[i.room],[...i.visitedRooms]},execute(e){if(i.visitedRooms||=[],i.visitedRooms.includes(i.room)||i.visitedRooms.push(i.room),i.isGameOver){if(e.toLowerCase().trim()===`restart`){let t=l(r,{debugInventory:n.debugInventory});return Object.assign(i,t),{echo:e.toUpperCase(),messages:[a.welcome,...F(r,i)]}}return{echo:e.toUpperCase(),messages:[`PRESS ANY KEY TO RESTART THE GAME.`]}}let t=Ue(e,r,i);if(!t)return{echo:null,messages:[]};i.turns+=1;let s=i.room,c={world:r,state:i,command:t},u=qe(c);if(u===null){let e=Fe[t.verb];u=e?e(c):null}u===null&&(u={messages:[a.dontUnderstand],consumeTurn:!1});let d=Array.isArray(u)?u:u.messages,f=Array.isArray(u)?!0:u.consumeTurn??!0;if(d.length===1&&d[0]===a.dontUnderstand&&(f=!1),!f)return--i.turns,{echo:e.toUpperCase(),messages:d,events:[]};let p=[],m=i.room;for(let e of o)d=d.concat(e({world:r,state:i})??[]);return i.room!==m&&p.push(`teleport`),i.isGameOver&&p.push(`gameOver`),i.room!==s&&!i.isGameOver&&(i.visitedRooms.includes(i.room)||i.visitedRooms.push(i.room),d=d.concat(F(r,i))),{echo:e.toUpperCase(),messages:d,events:p}}}}var Xe=[`/room <id>`,`/next`,`/prev`,`/rooms`,`/art`,`/help`];function Ze({engine:e,onJump:t}){let n=[...e.world.rooms.keys()].sort((e,t)=>e-t);function r(r){if(!e.world.rooms.has(r))return[`DEBUG: no room ${r} (valid: ${n[0]}-${n.at(-1)})`];e.state.room=r,history.replaceState(null,``,`#room-${r}`),t(r);let i=e.world.room(r);return[`DEBUG: jumped to room ${r} (type ${i.type})`,i.desc]}function i(t){let i=n.indexOf(e.state.room),a=n[(i+t+n.length)%n.length];return r(a)}let a=new Map;async function o(e){return a.has(e)||a.set(e,fetch(`art/room-${e}.webp`,{method:`HEAD`}).then(e=>e.ok).catch(()=>!1)),a.get(e)}return{initialRoom(){let t=/^#room-(\d+)$/.exec(location.hash),n=t?Number(t[1]):null;return n!==null&&e.world.rooms.has(n)?n:null},handle(t){let a=t.trim().toLowerCase();if(!a.startsWith(`/`))return null;let[s,c]=a.split(/\s+/);switch(s){case`/room`:return r(Number(c));case`/next`:return i(1);case`/prev`:return i(-1);case`/art`:return o(e.state.room).then(t=>[`DEBUG: art/room-${e.state.room}.webp ${t?`found`:`MISSING (showing gradient)`}`]);case`/rooms`:return Promise.all(n.map(o)).then(t=>n.map((n,r)=>{let i=e.world.room(n),a=t[r]?`*`:` `;return`${n===e.state.room?`>`:` `}${a} ${String(n).padStart(2)} t${i.type} ${i.desc.slice(8,52)}`}));case`/help`:return[`DEBUG COMMANDS:`,...Xe.map(e=>`  ${e}`),`  (* = has art)`];default:return[`DEBUG: unknown command ${s}. Try /help`]}}}}var Qe=`transylvania-debug-tester`;function q(){return localStorage.getItem(Qe)===`1`}function $e(){let e=!q();return localStorage.setItem(Qe,e?`1`:`0`),e}var J=null;function et(){if(J===null){let e=window.AudioContext??window.webkitAudioContext;J=e?new e:!1}return J&&J.state===`suspended`&&J.resume(),J||null}function tt(){return window.matchMedia?.(`(prefers-reduced-motion: reduce)`).matches??!1}function nt(e){let t=e.currentTime,n=.9,r=Math.floor(e.sampleRate*n),i=e.createBuffer(1,r,e.sampleRate),a=i.getChannelData(0);for(let e=0;e<r;e+=1)a[e]=(Math.random()*2-1)*(1-e/r);let o=e.createBufferSource();o.buffer=i;let s=e.createBiquadFilter();s.type=`bandpass`,s.Q.value=1.2,s.frequency.setValueAtTime(2400,t),s.frequency.exponentialRampToValueAtTime(220,t+n);let c=e.createGain();c.gain.setValueAtTime(1e-4,t),c.gain.exponentialRampToValueAtTime(.28,t+.08),c.gain.exponentialRampToValueAtTime(1e-4,t+n),o.connect(s).connect(c).connect(e.destination),o.start(t),o.stop(t+n);let l=e.createOscillator();l.type=`sine`,l.frequency.setValueAtTime(140,t),l.frequency.exponentialRampToValueAtTime(42,t+.35);let u=e.createGain();u.gain.setValueAtTime(1e-4,t),u.gain.exponentialRampToValueAtTime(.45,t+.02),u.gain.exponentialRampToValueAtTime(1e-4,t+.5),l.connect(u).connect(e.destination),l.start(t),l.stop(t+.5)}function rt(e){let t=e.currentTime,n=e.createOscillator();n.type=`triangle`,n.frequency.setValueAtTime(90,t),n.frequency.exponentialRampToValueAtTime(30,t+.7);let r=e.createGain();r.gain.setValueAtTime(1e-4,t),r.gain.exponentialRampToValueAtTime(.4,t+.03),r.gain.exponentialRampToValueAtTime(1e-4,t+.8),n.connect(r).connect(e.destination),n.start(t),n.stop(t+.8)}var it={teleport:nt,gameOver:rt};function at(e,t){return{prime(){et()},play(n){for(let r of n){if(!(r in it))continue;let n=et();if(n)try{it[r](n)}catch{}tt()?ct(e,r):st(e,r),t&&ct(t,r)}}}}function ot(e,t){e.classList.remove(t),e.offsetWidth,e.classList.add(t),e.addEventListener(`animationend`,()=>e.classList.remove(t),{once:!0})}function st(e,t){ot(e,t===`gameOver`?`fx-sink`:`fx-jolt`)}function ct(e,t){ot(e,t===`gameOver`?`fx-flash-red`:`fx-flash`)}var Y={1:{id:1,name:`Ancient Stump`,region:`forest`,x:380,y:640,icon:`🪵`},8:{id:8,name:`Cave Entrance`,region:`caves`,x:380,y:556,icon:`🪨`},3:{id:3,name:`Dark Forest`,region:`forest`,x:250,y:502,icon:`🌲`},16:{id:16,name:`Lake Shore`,region:`lake`,x:120,y:558,icon:`🌊`},15:{id:15,name:`Willow Tree`,region:`lake`,x:120,y:446,icon:`🌳`},19:{id:19,name:`Dirt Road`,region:`dwellings`,x:250,y:420,icon:`🛤️`},20:{id:20,name:`Grim Shack`,region:`dwellings`,x:150,y:384,icon:`🏚️`},21:{id:21,name:`Log Cabin`,region:`dwellings`,x:350,y:380,icon:`🛖`},22:{id:22,name:`Secret Annex`,region:`secret`,x:441,y:390,icon:`🚪`},17:{id:17,name:`Deep Forest`,region:`forest`,x:130,y:290,icon:`🌲`},2:{id:2,name:`Broken Wagon`,region:`forest`,x:250,y:294,icon:`🛒`},38:{id:38,name:`Inside Wagon`,region:`secret`,x:250,y:232,icon:`📦`},4:{id:4,name:`Forest Clearing`,region:`forest`,x:130,y:150,icon:`🌿`},5:{id:5,name:`Cemetery`,region:`cemetery`,x:250,y:170,icon:`🪦`},11:{id:11,name:`Secret Chamber`,region:`secret`,x:250,y:70,icon:`🗝️`},14:{id:14,name:`Dismal Forest`,region:`forest`,x:380,y:115,icon:`🌲`},23:{id:23,name:`Frame House`,region:`dwellings`,x:528,y:109,icon:`🏡`},24:{id:24,name:`Inside House`,region:`dwellings`,x:472,y:45,icon:`🛋️`},25:{id:25,name:`House Attic`,region:`dwellings`,x:410,y:45,icon:`🕯️`},12:{id:12,name:`Crossroad`,region:`forest`,x:379,y:494,icon:`➕`},18:{id:18,name:`Foreboding Forest`,region:`forest`,x:500,y:171,icon:`🌲`},6:{id:6,name:`Clay Hut Path`,region:`dwellings`,x:500,y:233,icon:`🛖`},7:{id:7,name:`Inside Clay Hut`,region:`dwellings`,x:580,y:350,icon:`🏺`},26:{id:26,name:`Sandy Field`,region:`forest`,x:600,y:288,icon:`🌾`},9:{id:9,name:`Dark Cave`,region:`caves`,x:490,y:640,icon:`🦇`},10:{id:10,name:`Crystal Cave`,region:`caves`,x:490,y:530,icon:`🔮`},13:{id:13,name:`Castle Approach`,region:`castle`,x:520,y:439,icon:`🏰`},27:{id:27,name:`Castle Entrance`,region:`castle`,x:698,y:384,icon:`🚪`},28:{id:28,name:`West Guardroom`,region:`castle`,x:642,y:540,icon:`🛡️`},29:{id:29,name:`East Parlor`,region:`castle`,x:770,y:540,icon:`🍷`},30:{id:30,name:`Grand Chamber`,region:`castle`,x:770,y:329,icon:`🏛️`},36:{id:36,name:`High Chamber`,region:`tower`,x:770,y:267,icon:`🪜`},37:{id:37,name:`Moonlit Tower`,region:`tower`,x:770,y:200,icon:`👸`},31:{id:31,name:`Castle Cellar`,region:`dungeon`,x:880,y:440,icon:`🗝️`},33:{id:33,name:`Dungeon Cell`,region:`dungeon`,x:880,y:540,icon:`⛓️`},34:{id:34,name:`Musty Dungeon`,region:`dungeon`,x:880,y:320,icon:`💀`},35:{id:35,name:`Royal Treasure`,region:`dungeon`,x:880,y:200,icon:`👑`},32:{id:32,name:`Featureless Void`,region:`secret`,x:620,y:640,icon:`🌀`}},lt={"1-9":`secret`,"5-11":`secret`,"21-22":`secret`,"6-7":`door`,"9-10":`door`,"19-20":`door`,"19-21":`door`,"23-24":`door`,"27-28":`door`,"27-29":`door`,"2-38":`door`,"13-27":`gate`,"27-30":`hall`},ut=[`N`,`S`,`W`,`E`],dt={N:`S`,S:`N`,E:`W`,W:`E`,U:`D`,D:`U`};function ft(e){let t=new Map;for(let n of e.rooms.values())for(let[e,r]of Object.entries(n.exits)){if(r<=0)continue;let i=Math.min(n.id,r),a=Math.max(n.id,r),o=`${i}-${a}`,s=t.get(o);s||(s={a:i,b:a,aToB:[],bToA:[],oneWay:!1,forward:!0,kind:`path`},t.set(o,s)),(n.id===i?s.aToB:s.bToA).push(e)}for(let e of t.values()){e.oneWay=e.aToB.length===0||e.bToA.length===0,e.twisted=!e.oneWay&&!(e.aToB.every(t=>e.bToA.includes(dt[t]))&&e.bToA.every(t=>e.aToB.includes(dt[t]))),e.forward=e.aToB.length>0;let t=[...e.aToB,...e.bToA].some(e=>e===`U`||e===`D`);e.kind=lt[`${e.a}-${e.b}`]??(t?`stairs`:`path`)}return[...t.values()]}function pt(e){let t=e=>e.filter(e=>ut.includes(e)).join(`/`)||e.join(`/`);return e.twisted?`${t(e.aToB)} / ${t(e.bToA)} back`:t(e.forward?e.aToB:e.bToA)}var mt={forest:{bg:`#064e3b`,border:`#10b981`,text:`#a7f3d0`},lake:{bg:`#083344`,border:`#06b6d4`,text:`#a5f3fc`},cemetery:{bg:`#2e1065`,border:`#8b5cf6`,text:`#ddd6fe`},dwellings:{bg:`#451a03`,border:`#f59e0b`,text:`#fde68a`},caves:{bg:`#1e293b`,border:`#64748b`,text:`#cbd5e1`},castle:{bg:`#4c0519`,border:`#f43f5e`,text:`#fecdd3`},tower:{bg:`#3b0764`,border:`#c084fc`,text:`#f3e8ff`},dungeon:{bg:`#450a0a`,border:`#ef4444`,text:`#fca5a5`},secret:{bg:`#500724`,border:`#ec4899`,text:`#fbcfe8`}};function ht(e){let{miniMapElement:t,miniMapViewport:n,miniMapBadge:r,drawerElement:i,drawerBody:a,drawerStats:o,drawerClose:s,drawerBackdrop:c}=e;a.innerHTML=`
    <div class="drawer-svg-wrap">
      <svg id="drawerMapSvg" viewBox="0 0 980 700" preserveAspectRatio="xMidYMid meet" class="trans-map-svg">
        <defs>
          <filter id="drawerGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <marker id="mapArrow" viewBox="0 0 10 10" refX="16" refY="5"
                  markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
          </marker>
          <pattern id="drawerGridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.03)" stroke-width="1"/>
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="#050811" />
        <rect width="100%" height="100%" fill="url(#drawerGridPattern)" />

        <!-- Regional Watermarks -->
        <text x="180" y="80" class="map-region-label">THE GREAT FOREST</text>
        <text x="750" y="100" class="map-region-label">CASTLE & CITADEL</text>
        <text x="60" y="580" class="map-region-label">LAKE SHORE</text>
        <text x="440" y="690" class="map-region-label">SUBTERRANEAN CAVES</text>

        <!-- Paths Layer -->
        <g id="drawerEdgesLayer"></g>

        <!-- Rooms Layer -->
        <g id="drawerRoomsLayer"></g>

        <!-- Current Player Marker Layer -->
        <g id="drawerPlayerLayer"></g>
      </svg>
    </div>
  `,n.innerHTML=`
    <svg id="miniSvg" viewBox="0 0 980 700" preserveAspectRatio="xMidYMid meet" class="mini-map-svg">
      <rect width="100%" height="100%" fill="#04060c" />
      <g id="miniEdgesLayer"></g>
      <g id="miniRoomsLayer"></g>
      <g id="miniPlayerLayer"></g>
    </svg>
  `;let l=a.querySelector(`#drawerEdgesLayer`),u=a.querySelector(`#drawerRoomsLayer`),d=a.querySelector(`#drawerPlayerLayer`),p=n.querySelector(`#miniEdgesLayer`),m=n.querySelector(`#miniRoomsLayer`),h=n.querySelector(`#miniPlayerLayer`),g=document.getElementById(`detailBadge`),_=document.getElementById(`detailName`),v=document.getElementById(`detailRegion`),y=document.getElementById(`detailDesc`),b=document.getElementById(`detailExits`),x=document.getElementById(`detailItems`),S=!1;function C(){S=!0,i.hidden=!1,i.setAttribute(`aria-hidden`,`false`),i.offsetWidth,i.classList.add(`open`),s&&s.focus()}function w(){S=!1,i.classList.remove(`open`),i.setAttribute(`aria-hidden`,`true`),setTimeout(()=>{S||(i.hidden=!0)},280)}function T(){S?w():C()}t&&(t.addEventListener(`click`,C),t.addEventListener(`keydown`,e=>{(e.key===`Enter`||e.key===` `)&&(e.preventDefault(),C())})),s&&s.addEventListener(`click`,w),c&&c.addEventListener(`click`,w);let E=document.getElementById(`mapDrawerExpand`),D=document.getElementById(`mapDrawerExpandText`),O=i?i.querySelector(`.map-drawer-panel`):null;E&&O&&E.addEventListener(`click`,()=>{let e=O.classList.toggle(`maximized`);E.classList.toggle(`active`,e),D&&(D.textContent=e?`RESTORE`:`MAXIMIZE`)}),window.addEventListener(`keydown`,e=>{e.key===`Escape`&&S&&w()});function k(e,t,n){let r=Y[e];if(r&&(g&&(g.textContent=`ROOM ${e}`),_&&(_.textContent=r.name),v&&(v.textContent=r.region.toUpperCase()),t&&t.rooms&&t.rooms.has(e))){let r=t.room(e);y&&(y.textContent=r.desc.replace(/\s+/g,` `).trim());let i=Object.entries(r.exits).filter(([,e])=>e>0).map(([e,t])=>{let n=Y[t];return`${e} → ${n?n.name:`Room ${t}`}`});if(b&&(b.innerHTML=`<strong>EXITS:</strong> ${i.length?i.join(` · `):`Special / None`}`),n&&x){let r=A(t,n,e).map(e=>f(t,n,e.id).replace(/\s+/g,` `).trim());x.innerHTML=r.length?`<strong>ITEMS HERE:</strong> ${r.join(`, `)}`:``}}}return{open:C,close:w,toggle:T,isOpen:()=>S,update({currentRoom:e,visitedRooms:t=[],world:n,state:i}){let a=new Set(t.length?t:[e]);a.add(e);let s=Object.keys(Y).length,c=Math.min(a.size,s);r&&(r.textContent=`${c}/${s}`),o&&(o.textContent=`${c} / ${s} CHARTED`),l.innerHTML=``,p.innerHTML=``;for(let e of ft(n)){let t=e.forward?e.a:e.b,n=e.forward?e.b:e.a,r=e.kind,i=Y[t],o=Y[n];if(!i||!o)continue;let s=a.has(t),c=a.has(n);if(s&&c){let t=document.createElementNS(`http://www.w3.org/2000/svg`,`line`);if(t.setAttribute(`x1`,i.x),t.setAttribute(`y1`,i.y),t.setAttribute(`x2`,o.x),t.setAttribute(`y2`,o.y),r===`secret`?(t.setAttribute(`class`,`map-edge map-edge-secret`),t.setAttribute(`stroke-dasharray`,`4,4`)):r===`stairs`?(t.setAttribute(`class`,`map-edge map-edge-stairs`),t.setAttribute(`stroke-dasharray`,`2,3`)):t.setAttribute(`class`,`map-edge map-edge-known`),e.oneWay||e.twisted){t.classList.add(e.twisted?`map-edge-twisted`:`map-edge-oneway`),e.oneWay&&t.setAttribute(`marker-end`,`url(#mapArrow)`);let n=document.createElementNS(`http://www.w3.org/2000/svg`,`text`);n.setAttribute(`x`,String((i.x+o.x)/2)),n.setAttribute(`y`,String((i.y+o.y)/2-6)),n.setAttribute(`class`,`map-edge-label`),n.setAttribute(`text-anchor`,`middle`),n.textContent=pt(e),l.appendChild(n)}l.appendChild(t);let n=t.cloneNode(!0);n.setAttribute(`stroke-width`,`3.5`),n.setAttribute(`stroke`,`#475569`),p.appendChild(n)}else if(s||c){let e=s?i:o,t=s?o:i,n=t.x-e.x,r=t.y-e.y,a=Math.hypot(n,r)||1,c=Math.min(a*.45,28),u=e.x+n/a*c,d=e.y+r/a*c,f=document.createElementNS(`http://www.w3.org/2000/svg`,`line`);f.setAttribute(`x1`,e.x),f.setAttribute(`y1`,e.y),f.setAttribute(`x2`,u),f.setAttribute(`y2`,d),f.setAttribute(`class`,`map-edge map-edge-stub`),f.setAttribute(`stroke-dasharray`,`3,3`),l.appendChild(f)}}u.innerHTML=``,m.innerHTML=``;for(let[t,r]of Object.entries(Y)){let o=Number(t),s=a.has(o),c=o===e,l=mt[r.region]||mt.forest,d=document.createElementNS(`http://www.w3.org/2000/svg`,`g`);if(d.setAttribute(`class`,`map-room ${s?`discovered`:`uncharted`} ${c?`current`:``}`),d.setAttribute(`transform`,`translate(${r.x}, ${r.y})`),s){d.setAttribute(`tabindex`,`0`),d.setAttribute(`role`,`button`),d.setAttribute(`aria-label`,`Room ${o}: ${r.name}`);let e=document.createElementNS(`http://www.w3.org/2000/svg`,`rect`);e.setAttribute(`x`,`-44`),e.setAttribute(`y`,`-20`),e.setAttribute(`width`,`88`),e.setAttribute(`height`,`40`),e.setAttribute(`rx`,`8`),e.setAttribute(`fill`,c?`#0f172a`:l.bg),e.setAttribute(`stroke`,c?`#38bdf8`:l.border),e.setAttribute(`stroke-width`,c?`2.5`:`1.5`),c&&e.setAttribute(`filter`,`url(#drawerGlow)`),d.appendChild(e);let t=document.createElementNS(`http://www.w3.org/2000/svg`,`text`);t.setAttribute(`x`,`-29`),t.setAttribute(`y`,`6`),t.setAttribute(`class`,`map-room-icon`),t.textContent=r.icon,d.appendChild(t);let a=document.createElementNS(`http://www.w3.org/2000/svg`,`text`);a.setAttribute(`x`,`-8`),a.setAttribute(`y`,`-3`),a.setAttribute(`class`,`map-room-title`),a.textContent=r.name.length>12?r.name.slice(0,11)+`…`:r.name,d.appendChild(a);let s=document.createElementNS(`http://www.w3.org/2000/svg`,`text`);s.setAttribute(`x`,`-8`),s.setAttribute(`y`,`10`),s.setAttribute(`class`,`map-room-sub`),s.textContent=`RM ${r.id}`,d.appendChild(s),d.addEventListener(`click`,()=>k(o,n,i)),d.addEventListener(`mouseenter`,()=>k(o,n,i));let u=document.createElementNS(`http://www.w3.org/2000/svg`,`g`);u.setAttribute(`transform`,`translate(${r.x}, ${r.y})`);let f=document.createElementNS(`http://www.w3.org/2000/svg`,`circle`);f.setAttribute(`cx`,`0`),f.setAttribute(`cy`,`0`),f.setAttribute(`r`,c?`12`:`9`),f.setAttribute(`fill`,c?`#38bdf8`:l.border),f.setAttribute(`stroke`,`#fff`),f.setAttribute(`stroke-width`,c?`2`:`0`),u.appendChild(f),m.appendChild(u)}else{let e=document.createElementNS(`http://www.w3.org/2000/svg`,`circle`);e.setAttribute(`cx`,`0`),e.setAttribute(`cy`,`0`),e.setAttribute(`r`,`5`),e.setAttribute(`class`,`map-fog-node`),d.appendChild(e)}u.appendChild(d)}d.innerHTML=``,h.innerHTML=``;let f=Y[e];if(f){let e=document.createElementNS(`http://www.w3.org/2000/svg`,`g`);e.setAttribute(`transform`,`translate(${f.x}, ${f.y})`);let t=document.createElementNS(`http://www.w3.org/2000/svg`,`circle`);t.setAttribute(`cx`,`0`),t.setAttribute(`cy`,`0`),t.setAttribute(`r`,`34`),t.setAttribute(`class`,`map-player-pulse`),e.appendChild(t);let n=document.createElementNS(`http://www.w3.org/2000/svg`,`g`);n.setAttribute(`transform`,`translate(0, -30)`),n.setAttribute(`class`,`map-player-pin`);let r=document.createElementNS(`http://www.w3.org/2000/svg`,`rect`);r.setAttribute(`x`,`-38`),r.setAttribute(`y`,`-11`),r.setAttribute(`width`,`76`),r.setAttribute(`height`,`18`),r.setAttribute(`rx`,`4`),r.setAttribute(`fill`,`#0284c7`),r.setAttribute(`stroke`,`#e0f2fe`),r.setAttribute(`stroke-width`,`1`),n.appendChild(r);let i=document.createElementNS(`http://www.w3.org/2000/svg`,`text`);i.setAttribute(`x`,`0`),i.setAttribute(`y`,`2`),i.setAttribute(`text-anchor`,`middle`),i.setAttribute(`class`,`map-pin-text`),i.textContent=`YOU ARE HERE`,n.appendChild(i),e.appendChild(n),d.appendChild(e);let a=document.createElementNS(`http://www.w3.org/2000/svg`,`circle`);a.setAttribute(`cx`,f.x),a.setAttribute(`cy`,f.y),a.setAttribute(`r`,`20`),a.setAttribute(`class`,`mini-player-pulse`),h.appendChild(a)}k(e,n,i)}}}var gt=`
  <defs>
    <!-- Paper drop shadow -->
    <filter id="paperShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="3" dy="6" stdDeviation="6" flood-color="#000000" flood-opacity="0.85"/>
    </filter>

    <!-- Acid rune mystic glow -->
    <filter id="runeGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- Metal / Key sparkle -->
    <filter id="goldGlint" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#fbbf24" flood-opacity="0.9"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- Extraterrestrial cyan saucer aura -->
    <filter id="saucerGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- Blood / Werewolf / Vampire threat glow -->
    <filter id="bloodGlow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#ef4444" flood-opacity="0.85"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- Smoldering embers glow -->
    <filter id="emberGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#f97316" flood-opacity="0.9"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- Parchment paper gradient -->
    <linearGradient id="parchmentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#faebd7"/>
      <stop offset="60%" stop-color="#e9d3ac"/>
      <stop offset="100%" stop-color="#cfb07e"/>
    </linearGradient>

    <!-- Wood cross gradient -->
    <linearGradient id="woodCrossGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#5a3d28"/>
      <stop offset="50%" stop-color="#3b2617"/>
      <stop offset="100%" stop-color="#23140a"/>
    </linearGradient>

    <!-- Gold key gradient -->
    <linearGradient id="goldKeyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#b45309"/>
    </linearGradient>

    <!-- Silver bullet gradient -->
    <linearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="40%" stop-color="#e2e8f0"/>
      <stop offset="80%" stop-color="#94a3b8"/>
      <stop offset="100%" stop-color="#475569"/>
    </linearGradient>
  </defs>
`,X=new WeakMap;function Z(e,t){(X.get(e)??e).setAttribute(`transform`,t)}function Q(e){return X.get(e)??e}function $(e,t){let n=document.createElementNS(`http://www.w3.org/2000/svg`,`g`),r=document.createElementNS(`http://www.w3.org/2000/svg`,`g`);n.appendChild(r),X.set(r,n),r.setAttribute(`class`,`scene-prop-interactive`),r.setAttribute(`tabindex`,`0`),r.setAttribute(`role`,`button`),r.setAttribute(`aria-label`,e);let i=document.createElementNS(`http://www.w3.org/2000/svg`,`title`);return i.textContent=`${e} (Click to interact)`,r.appendChild(i),t&&(r.addEventListener(`click`,e=>{e.stopPropagation(),t()}),r.addEventListener(`keydown`,e=>{(e.key===`Enter`||e.key===` `)&&(e.preventDefault(),e.stopPropagation(),t())})),r}function _t(e,t,n){if(t.objectLoc[18]===3){let t=$(`Wrinkled Note`,()=>n?.(`get note`));Z(t,`translate(530, 770) rotate(-6)`),t.innerHTML+=`
      <!-- Ground shadow -->
      <ellipse cx="6" cy="18" rx="72" ry="32" fill="rgba(0, 0, 0, 0.65)" filter="url(#paperShadow)" />

      <!-- Crumpled paper body with folded corners -->
      <polygon points="-58,-28 42,-34 68,14 46,38 -48,32 -66,4" 
               fill="url(#parchmentGrad)" 
               stroke="#6b4e2e" 
               stroke-width="1.8" 
               filter="url(#paperShadow)" />

      <!-- Crease lines -->
      <line x1="-58" y1="-28" x2="6" y2="4" stroke="#a27c52" stroke-width="1.2" stroke-opacity="0.8"/>
      <line x1="42" y1="-34" x2="-14" y2="18" stroke="#a27c52" stroke-width="1.2" stroke-opacity="0.8"/>
      <line x1="-48" y1="32" x2="18" y2="-12" stroke="#a27c52" stroke-width="1" stroke-opacity="0.7"/>

      <!-- Faint cursive handwritten lines -->
      <path d="M -40 -12 Q -20 -15 0 -11 Q 20 -7 38 -12" fill="none" stroke="#4a3724" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M -36 4 Q -10 1 12 6 Q 24 8 36 3" fill="none" stroke="#4a3724" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M -30 18 Q -8 16 14 19 Q 20 20 28 17" fill="none" stroke="#4a3724" stroke-width="1.2" stroke-linecap="round"/>

      <!-- Interactive floating callout pill -->
      <g class="prop-badge">
        <rect x="-42" y="-56" width="84" height="20" rx="10" fill="rgba(6, 9, 18, 0.9)" stroke="#38bdf8" stroke-width="1.2"/>
        <text x="0" y="-42" text-anchor="middle" class="prop-badge-text">📜 NOTE</text>
      </g>
    `,e.appendChild(Q(t))}}function vt(e,t,n){if(t.objectLoc[28]===4){let t=$(`Glowing Extraterrestrial Saucer`,()=>n?.(`look saucer`));Z(t,`translate(512, 690)`),t.innerHTML+=`
      <!-- Crash impact crater & smoke -->
      <ellipse cx="0" cy="40" rx="190" ry="60" fill="#030712" opacity="0.85" />
      
      <!-- Pulsating cyan aura -->
      <ellipse cx="0" cy="0" rx="150" ry="46" fill="none" stroke="#38bdf8" stroke-width="6" opacity="0.6" filter="url(#saucerGlow)"/>

      <!-- Metallic saucer hull -->
      <ellipse cx="0" cy="6" rx="140" ry="40" fill="#1e293b" stroke="#0ea5e9" stroke-width="2.5"/>
      <ellipse cx="0" cy="-14" rx="75" ry="32" fill="#0284c7" stroke="#e0f2fe" stroke-width="2" opacity="0.85" filter="url(#saucerGlow)"/>
      <ellipse cx="0" cy="-20" rx="42" ry="18" fill="#ffffff" opacity="0.75"/>

      <!-- Navigation lights -->
      <circle cx="-100" cy="6" r="5" fill="#f43f5e"/>
      <circle cx="-50" cy="18" r="5" fill="#eab308"/>
      <circle cx="0" cy="22" r="6" fill="#38bdf8"/>
      <circle cx="50" cy="18" r="5" fill="#eab308"/>
      <circle cx="100" cy="6" r="5" fill="#f43f5e"/>

      <g class="prop-badge">
        <rect x="-56" y="-76" width="112" height="22" rx="11" fill="rgba(6, 9, 18, 0.92)" stroke="#38bdf8" stroke-width="1.2"/>
        <text x="0" y="-61" text-anchor="middle" class="prop-badge-text">🛸 GLOWING SAUCER</text>
      </g>
    `,e.appendChild(Q(t));return}if(t.objectLoc[2]===4){let t=$(`Alien Creature Statue`,()=>n?.(`look statue`));Z(t,`translate(512, 740)`),t.innerHTML+=`
      <!-- Pedestal shadow -->
      <ellipse cx="0" cy="0" rx="80" ry="22" fill="rgba(0,0,0,0.7)" filter="url(#paperShadow)"/>

      <image href="art/props/statue.webp" x="-146" y="-380" width="293" height="380" filter="url(#paperShadow)"/>

      <g class="prop-badge">
        <rect x="-65" y="-410" width="130" height="22" rx="11" fill="rgba(6, 9, 18, 0.95)" stroke="#38bdf8" stroke-width="1.2"/>
        <text x="0" y="-395" text-anchor="middle" class="prop-badge-text">🗿 ALIEN STATUE</text>
      </g>
    `,e.appendChild(Q(t));return}if(t.objectLoc[2]===-1&&t.timers.R>0){let t=$(`Smoking Shattered Pedestal`,()=>n?.(`look pedestal`));Z(t,`translate(512, 700)`),t.innerHTML+=`
      <!-- Scorch mark & shadow -->
      <ellipse cx="0" cy="30" rx="90" ry="28" fill="rgba(0,0,0,0.7)" filter="url(#paperShadow)"/>
      
      <!-- Cracked fractured pedestal stump -->
      <polygon points="-65,10 65,10 75,35 -75,35" fill="#18181b" stroke="#09090b" stroke-width="2"/>
      <polygon points="-45,-15 10,-5 45,-18 35,10 -40,10" fill="#27272a" stroke="#3f3f46" stroke-width="2"/>

      <!-- Glowing fracture lines & embers -->
      <line x1="-20" y1="-10" x2="-5" y2="8" stroke="#ef4444" stroke-width="2" filter="url(#runeGlow)"/>
      <line x1="5" y1="-8" x2="25" y2="5" stroke="#f97316" stroke-width="2" filter="url(#runeGlow)"/>
      <circle cx="-10" cy="2" r="3" fill="#f97316" filter="url(#runeGlow)" class="ember-particle"/>
      <circle cx="15" cy="-2" r="2.5" fill="#ef4444" filter="url(#runeGlow)"/>

      <!-- Rising wisps of smoke -->
      <path d="M -10 -15 Q -25 -40 -10 -60 Q 5 -80 -5 -100" fill="none" stroke="#64748b" stroke-width="2" opacity="0.45" stroke-linecap="round"/>
      <path d="M 15 -12 Q 5 -35 20 -55 Q 30 -75 15 -95" fill="none" stroke="#94a3b8" stroke-width="2.5" opacity="0.4" stroke-linecap="round"/>

      <g class="prop-badge">
        <rect x="-70" y="-85" width="140" height="22" rx="11" fill="rgba(6, 9, 18, 0.95)" stroke="#f97316" stroke-width="1.2"/>
        <text x="0" y="-70" text-anchor="middle" class="prop-badge-text">💨 SMOKING PEDESTAL</text>
      </g>
    `,e.appendChild(Q(t))}}function yt(e,t,n){if(t.objectLoc[6]===5){let t=$(`Wooden Cross`,()=>n?.(`get cross`));Z(t,`translate(310, 680)`),t.innerHTML+=`
      <!-- Cross shadow -->
      <polygon points="10,65 140,80 160,95 20,80" fill="rgba(0,0,0,0.55)" filter="url(#paperShadow)"/>

      <!-- Vertical timber beam -->
      <rect x="-9" y="-80" width="18" height="150" rx="3" fill="url(#woodCrossGrad)" stroke="#1a0f08" stroke-width="1.8" filter="url(#paperShadow)"/>
      
      <!-- Horizontal crossbar -->
      <rect x="-48" y="-54" width="96" height="16" rx="3" fill="url(#woodCrossGrad)" stroke="#1a0f08" stroke-width="1.8" filter="url(#paperShadow)"/>

      <!-- Wood grain & iron nail in center -->
      <circle cx="0" cy="-46" r="3.5" fill="#0f172a" stroke="#475569" stroke-width="1"/>
      <line x1="-38" y1="-46" x2="38" y2="-46" stroke="#2a180e" stroke-width="1"/>

      <g class="prop-badge">
        <rect x="-42" y="-110" width="84" height="20" rx="10" fill="rgba(6, 9, 18, 0.9)" stroke="#cbd5e1" stroke-width="1"/>
        <text x="0" y="-96" text-anchor="middle" class="prop-badge-text">✝️ CROSS</text>
      </g>
    `,e.appendChild(Q(t))}if(t.objectLoc[13]===5){let r=t.flags.GT===1,i=$(r?`Open Shaft Down to Catacombs`:`Locked Rusty Iron Grate`,()=>n?.(r?`go down`:`unlock grate`));Z(i,`translate(660, 750)`),r?i.innerHTML+=`
        <!-- Earth opening & pit -->
        <polygon points="-85,-35 85,-35 95,45 -95,45" fill="#020617" stroke="#475569" stroke-width="3"/>
        <rect x="-70" y="-25" width="140" height="60" fill="#000000"/>

        <!-- Descending ladder rungs -->
        <line x1="-30" y1="-20" x2="-30" y2="35" stroke="#64748b" stroke-width="3"/>
        <line x1="30" y1="-20" x2="30" y2="35" stroke="#64748b" stroke-width="3"/>
        <line x1="-30" y1="-10" x2="30" y2="-10" stroke="#94a3b8" stroke-width="2.5"/>
        <line x1="-30" y1="5" x2="30" y2="5" stroke="#94a3b8" stroke-width="2.5"/>
        <line x1="-30" y1="20" x2="30" y2="20" stroke="#94a3b8" stroke-width="2.5"/>

        <!-- Swung-open grate door leaning back -->
        <polygon points="-80,-35 -85,-110 5,-105 10,-35" fill="none" stroke="#94a3b8" stroke-width="2.5" stroke-dasharray="8,4"/>

        <g class="prop-badge">
          <rect x="-60" y="-80" width="120" height="22" rx="11" fill="rgba(6, 9, 18, 0.95)" stroke="#38bdf8" stroke-width="1.2"/>
          <text x="0" y="-65" text-anchor="middle" class="prop-badge-text">🪜 LADDER DOWN</text>
        </g>
      `:i.innerHTML+=`
        <polygon points="-85,-35 85,-35 95,45 -95,45" fill="#18181b" stroke="#52525b" stroke-width="3.5"/>
        <!-- Grate grid bars -->
        <line x1="-60" y1="-30" x2="-70" y2="40" stroke="#71717a" stroke-width="3"/>
        <line x1="-30" y1="-32" x2="-35" y2="42" stroke="#71717a" stroke-width="3"/>
        <line x1="0" y1="-33" x2="0" y2="43" stroke="#71717a" stroke-width="3"/>
        <line x1="30" y1="-32" x2="35" y2="42" stroke="#71717a" stroke-width="3"/>
        <line x1="60" y1="-30" x2="70" y2="40" stroke="#71717a" stroke-width="3"/>
        <line x1="-80" y1="-10" x2="80" y2="-10" stroke="#71717a" stroke-width="3"/>
        <line x1="-85" y1="18" x2="85" y2="18" stroke="#71717a" stroke-width="3"/>

        <!-- Padlock in center -->
        <rect x="-12" y="0" width="24" height="20" rx="3" fill="#b45309" stroke="#fbbf24" stroke-width="1.5"/>
        <path d="M -7 0 L -7 -8 A 7 7 0 0 1 7 -8 L 7 0" fill="none" stroke="#e2e8f0" stroke-width="2.2"/>

        <g class="prop-badge">
          <rect x="-64" y="-70" width="128" height="22" rx="11" fill="rgba(6, 9, 18, 0.95)" stroke="#fbbf24" stroke-width="1.2"/>
          <text x="0" y="-55" text-anchor="middle" class="prop-badge-text">🔒 LOCKED GRATE</text>
        </g>
      `,e.appendChild(Q(i))}}function bt(e,t,n){if(t.objectLoc[1]===7){let t=$(`Bottle of Weak Acid`,()=>n?.(`get acid`));Z(t,`translate(280, 520)`),t.innerHTML+=`
      <!-- Glass vial with glowing green acid -->
      <rect x="-14" y="-28" width="28" height="46" rx="6" fill="#14532d" stroke="#4ade80" stroke-width="1.8" filter="url(#runeGlow)"/>
      <rect x="-8" y="-40" width="16" height="14" fill="#1e293b" stroke="#4ade80" stroke-width="1.5"/>
      <polygon points="-7,-40 7,-40 5,-48 -5,-48" fill="#a16207"/>
      <!-- Acid fluid level -->
      <rect x="-10" y="-12" width="20" height="26" rx="4" fill="#22c55e" opacity="0.85"/>
      <circle cx="-3" cy="2" r="2" fill="#86efac"/>
      <circle cx="4" cy="-4" r="1.5" fill="#86efac"/>

      <g class="prop-badge">
        <rect x="-38" y="-72" width="76" height="20" rx="10" fill="rgba(6, 9, 18, 0.9)" stroke="#4ade80" stroke-width="1"/>
        <text x="0" y="-58" text-anchor="middle" class="prop-badge-text">🧪 ACID</text>
      </g>
    `,e.appendChild(Q(t))}if(t.objectLoc[25]===7){let t=$(`Witch's Broom`,()=>n?.(`get broom`));Z(t,`translate(790, 620) rotate(14)`),t.innerHTML+=`
      <!-- Broom handle -->
      <rect x="-5" y="-140" width="10" height="150" rx="3" fill="#78350f" stroke="#451a03" stroke-width="1.5"/>
      <!-- Straw bristles -->
      <polygon points="-24,10 24,10 32,80 -32,80" fill="#ca8a04" stroke="#713f12" stroke-width="1.5"/>
      <line x1="-16" y1="35" x2="16" y2="35" stroke="#451a03" stroke-width="3"/>

      <g class="prop-badge" transform="rotate(-14)">
        <rect x="-42" y="-170" width="84" height="20" rx="10" fill="rgba(6, 9, 18, 0.9)" stroke="#ca8a04" stroke-width="1"/>
        <text x="0" y="-156" text-anchor="middle" class="prop-badge-text">🧹 BROOM</text>
      </g>
    `,e.appendChild(Q(t))}if(t.objectLoc[24]===7){let t=$(`Black Cat`,()=>n?.(`look cat`));Z(t,`translate(530, 700)`),t.innerHTML+=`
      <ellipse cx="0" cy="0" rx="50" ry="14" fill="rgba(0,0,0,0.5)" filter="url(#paperShadow)"/>
      <image href="art/props/cat.webp" x="-70.5" y="-220" width="141" height="220" filter="url(#paperShadow)"/>

      <g class="prop-badge">
        <rect x="-42" y="-245" width="84" height="20" rx="10" fill="rgba(6, 9, 18, 0.9)" stroke="#eab308" stroke-width="1"/>
        <text x="0" y="-231" text-anchor="middle" class="prop-badge-text">🐈‍⬛ BLACK CAT</text>
      </g>
    `,e.appendChild(Q(t))}}function xt(e,t,n){if(t.objectLoc[7]===9){let t=$(`Swarm of Buzzing Flies`,()=>n?.(`catch flies`));Z(t,`translate(420, 480)`),t.innerHTML+=`
      <!-- Animated buzzing fly particle cloud -->
      <circle cx="-20" cy="-15" r="3.5" fill="#000" stroke="#64748b" stroke-width="1" class="fly-particle"/>
      <circle cx="15" cy="-25" r="3" fill="#000" stroke="#64748b" stroke-width="1" class="fly-particle"/>
      <circle cx="30" cy="10" r="3.5" fill="#000" stroke="#64748b" stroke-width="1" class="fly-particle"/>
      <circle cx="-10" cy="20" r="4" fill="#000" stroke="#64748b" stroke-width="1" class="fly-particle"/>
      <circle cx="-35" cy="5" r="2.5" fill="#000" stroke="#64748b" stroke-width="1" class="fly-particle"/>
      <circle cx="5" cy="-5" r="3.5" fill="#000" stroke="#64748b" stroke-width="1" class="fly-particle"/>

      <g class="prop-badge">
        <rect x="-56" y="-55" width="112" height="20" rx="10" fill="rgba(6, 9, 18, 0.9)" stroke="#94a3b8" stroke-width="1"/>
        <text x="0" y="-41" text-anchor="middle" class="prop-badge-text">🪰 CATCH FLIES</text>
      </g>
    `,e.appendChild(Q(t))}if(t.objectLoc[31]===9){let r=t.objectLoc[7]===9,i=$(`Piece of Flypaper`,()=>n?.(r?`use flypaper`:`get flypaper`));Z(i,`translate(580, 580)`),i.innerHTML+=`
      <!-- Shadow on cave floor -->
      <ellipse cx="0" cy="20" rx="42" ry="12" fill="rgba(0,0,0,0.6)" filter="url(#paperShadow)"/>
      <!-- Sticky amber flypaper ribbon resting on cavern floor -->
      <path d="M -35 15 Q -10 5 15 22 Q 30 10 42 16" fill="none" stroke="#d97706" stroke-width="10" stroke-linecap="round"/>
      <path d="M -35 15 Q -10 5 15 22 Q 30 10 42 16" fill="none" stroke="#fbbf24" stroke-width="6" stroke-linecap="round" opacity="0.85"/>
      <!-- Trapped black specks -->
      <circle cx="-20" cy="12" r="1.5" fill="#000"/>
      <circle cx="5" cy="16" r="1.8" fill="#000"/>
      <circle cx="28" cy="14" r="1.5" fill="#000"/>

      <g class="prop-badge">
        <rect x="-56" y="-45" width="112" height="20" rx="10" fill="rgba(6, 9, 18, 0.9)" stroke="#fbbf24" stroke-width="1.2"/>
        <text x="0" y="-31" text-anchor="middle" class="prop-badge-text">🪰 FLYPAPER</text>
      </g>
    `,e.appendChild(Q(i))}if(t.objectLoc[33]===9){let t=$(`Magic Book`,()=>n?.(`read book`));Z(t,`translate(680, 680)`),t.innerHTML+=`
      <!-- Pedestal shadow -->
      <ellipse cx="0" cy="30" rx="55" ry="18" fill="rgba(0,0,0,0.7)" filter="url(#paperShadow)"/>
      <!-- Ancient stone pedestal -->
      <polygon points="-38,28 38,28 48,60 -48,60" fill="#27272a" stroke="#52525b" stroke-width="2"/>
      <rect x="-44" y="20" width="88" height="10" fill="#3f3f46" stroke="#71717a" stroke-width="1.5"/>
      <!-- Open leather-bound grimoire -->
      <polygon points="-52,-15 0,-8 52,-15 48,15 0,22 -48,15" fill="#78350f" stroke="#451a03" stroke-width="2" filter="url(#paperShadow)"/>
      <!-- Parchment pages -->
      <polygon points="-48,-12 -2,-6 -2,18 -44,12" fill="#fef3c7"/>
      <polygon points="2,-6 48,-12 44,12 2,18" fill="#fef3c7"/>
      <!-- Runic spell text -->
      <line x1="-40" y1="-4" x2="-8" y2="-4" stroke="#78350f" stroke-width="1.5"/>
      <line x1="-38" y1="4" x2="-10" y2="4" stroke="#78350f" stroke-width="1.5"/>
      <line x1="10" y1="-4" x2="42" y2="-4" stroke="#78350f" stroke-width="1.5"/>
      <line x1="12" y1="4" x2="38" y2="4" stroke="#78350f" stroke-width="1.5"/>
      <!-- Arcane seal glowing on left page -->
      <circle cx="-25" cy="0" r="6" fill="none" stroke="#dc2626" stroke-width="1.2"/>

      <g class="prop-badge">
        <rect x="-56" y="-45" width="112" height="20" rx="10" fill="rgba(6, 9, 18, 0.9)" stroke="#f59e0b" stroke-width="1.2"/>
        <text x="0" y="-31" text-anchor="middle" class="prop-badge-text">📖 MAGIC BOOK</text>
      </g>
    `,e.appendChild(Q(t))}}function St(e,t,n){if(t.objectLoc[8]===16){let t=$(`Plump Bullfrog`,()=>n?.(`feed frog`));Z(t,`translate(340, 800)`),t.innerHTML+=`
      <ellipse cx="0" cy="0" rx="45" ry="12" fill="rgba(0,0,0,0.5)" filter="url(#paperShadow)"/>
      <image href="art/props/frog.webp" x="-92.5" y="-160" width="185" height="160" filter="url(#paperShadow)"/>

      <g class="prop-badge">
        <rect x="-48" y="-185" width="96" height="20" rx="10" fill="rgba(6, 9, 18, 0.9)" stroke="#22c55e" stroke-width="1.2"/>
        <text x="0" y="-171" text-anchor="middle" class="prop-badge-text">🐸 BULLFROG</text>
      </g>
    `,e.appendChild(Q(t))}else{let t=document.createElementNS(`http://www.w3.org/2000/svg`,`g`);Z(t,`translate(340, 770)`),t.innerHTML=`
      <ellipse cx="0" cy="8" rx="48" ry="16" fill="none" stroke="#38bdf8" stroke-width="2" opacity="0.5" class="water-ripple"/>
      <ellipse cx="0" cy="8" rx="28" ry="9" fill="none" stroke="#38bdf8" stroke-width="1.5" opacity="0.7"/>
    `,e.appendChild(Q(t))}if(t.objectLoc[30]===16){let t=$(`Small Sailboat`,()=>n?.(`sail boat`));Z(t,`translate(720, 680)`),t.innerHTML+=`
      <!-- Boat hull shadow on water -->
      <ellipse cx="0" cy="24" rx="75" ry="18" fill="rgba(2, 6, 23, 0.6)" filter="url(#paperShadow)"/>
      <!-- Wooden hull -->
      <path d="M -70 10 Q -40 32 0 32 Q 40 32 75 10 Q 30 18 -70 10 Z" fill="#78350f" stroke="#451a03" stroke-width="2.5"/>
      <line x1="-60" y1="12" x2="65" y2="12" stroke="#b45309" stroke-width="1.8"/>
      <!-- Mast & furled white sail -->
      <line x1="-5" y1="12" x2="-5" y2="-75" stroke="#3b2617" stroke-width="3"/>
      <path d="M -5 -70 Q 25 -35 -2 0" fill="none" stroke="#f1f5f9" stroke-width="8" stroke-linecap="round" opacity="0.9"/>
      <!-- Mooring rope to wooden post -->
      <rect x="75" y="0" width="8" height="28" rx="2" fill="#451a03"/>
      <path d="M 60 12 Q 72 8 76 10" fill="none" stroke="#ca8a04" stroke-width="2"/>

      <g class="prop-badge">
        <rect x="-48" y="-95" width="96" height="20" rx="10" fill="rgba(6, 9, 18, 0.9)" stroke="#38bdf8" stroke-width="1.2"/>
        <text x="0" y="-81" text-anchor="middle" class="prop-badge-text">⛵ SAILBOAT</text>
      </g>
    `,e.appendChild(Q(t))}}function Ct(e,t,n){if(t.objectLoc[36]===11){let t=$(`Magic Elixir`,()=>n?.(`get elixir`));Z(t,`translate(512, 650)`),t.innerHTML+=`
      <!-- Altar shadow -->
      <ellipse cx="0" cy="30" rx="60" ry="18" fill="rgba(0,0,0,0.6)" filter="url(#paperShadow)"/>
      <!-- Glowing sapphire crystal potion bottle -->
      <polygon points="-16,-20 16,-20 22,20 -22,20" fill="#0284c7" stroke="#38bdf8" stroke-width="2" filter="url(#saucerGlow)"/>
      <rect x="-8" y="-32" width="16" height="12" fill="#0369a1" stroke="#38bdf8" stroke-width="1.5"/>
      <polygon points="-6,-32 6,-32 4,-40 -4,-40" fill="#ca8a04"/>
      <!-- Swirling magical liquid inside -->
      <ellipse cx="0" cy="6" rx="14" ry="10" fill="#67e8f9" opacity="0.9"/>
      <circle cx="-4" cy="2" r="2.5" fill="#ffffff"/>
      <circle cx="5" cy="8" r="2" fill="#ffffff"/>

      <g class="prop-badge">
        <rect x="-52" y="-68" width="104" height="22" rx="11" fill="rgba(6, 9, 18, 0.95)" stroke="#38bdf8" stroke-width="1.2"/>
        <text x="0" y="-53" text-anchor="middle" class="prop-badge-text">🧪 MAGIC ELIXIR</text>
      </g>
    `,e.appendChild(Q(t))}}function wt(e,t,n){let r=$(`Wooden Warning Sign`,()=>n?.(`read sign`));Z(r,`translate(450, 620) rotate(-4)`),r.innerHTML+=`
    <!-- Sign board nailed to tree trunk -->
    <rect x="-70" y="-35" width="140" height="70" rx="4" fill="url(#woodCrossGrad)" stroke="#1a0f08" stroke-width="2.2" filter="url(#paperShadow)"/>
    <circle cx="-55" cy="-22" r="3" fill="#475569"/>
    <circle cx="55" cy="-22" r="3" fill="#475569"/>
    <!-- Carved warning text lines -->
    <text x="0" y="-12" text-anchor="middle" fill="#fcd34d" font-size="9" font-weight="800" font-family="monospace">WARNING</text>
    <line x1="-50" y1="4" x2="50" y2="4" stroke="#a16207" stroke-width="1.5"/>
    <line x1="-44" y1="14" x2="44" y2="14" stroke="#a16207" stroke-width="1.5"/>
    <line x1="-36" y1="24" x2="36" y2="24" stroke="#a16207" stroke-width="1.5"/>

    <g class="prop-badge" transform="rotate(4)">
      <rect x="-42" y="-62" width="84" height="20" rx="10" fill="rgba(6, 9, 18, 0.9)" stroke="#f59e0b" stroke-width="1"/>
      <text x="0" y="-48" text-anchor="middle" class="prop-badge-text">🪧 SIGN</text>
    </g>
  `,e.appendChild(Q(r))}function Tt(e,t,n){if(t.objectLoc[32]===20){let t=$(`Garlic Clove`,()=>n?.(`get garlic`));Z(t,`translate(490, 520)`),t.innerHTML+=`
      <!-- Hanging hemp string -->
      <line x1="0" y1="-70" x2="0" y2="-22" stroke="#a16207" stroke-width="2.5" stroke-linecap="round"/>
      <ellipse cx="0" cy="-22" rx="5" ry="3" fill="#78350f"/>

      <!-- Braided garlic cluster shadow -->
      <ellipse cx="6" cy="10" rx="28" ry="32" fill="rgba(0,0,0,0.55)" filter="url(#paperShadow)"/>

      <!-- Plump garlic bulb with cloves and root filaments -->
      <ellipse cx="-8" cy="-2" rx="14" ry="18" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5"/>
      <ellipse cx="8" cy="-2" rx="14" ry="18" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5"/>
      <ellipse cx="0" cy="6" rx="18" ry="22" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.8" filter="url(#paperShadow)"/>
      <path d="M -6 -16 Q 0 -6 -6 24" fill="none" stroke="#cbd5e1" stroke-width="1.2"/>
      <path d="M 6 -16 Q 0 -6 6 24" fill="none" stroke="#cbd5e1" stroke-width="1.2"/>
      <path d="M 0 24 L -4 34 M 0 24 L 0 36 M 0 24 L 4 33" stroke="#d97706" stroke-width="1.5" stroke-linecap="round"/>

      <g class="prop-badge">
        <rect x="-48" y="-62" width="96" height="20" rx="10" fill="rgba(6, 9, 18, 0.9)" stroke="#cbd5e1" stroke-width="1.2"/>
        <text x="0" y="-48" text-anchor="middle" class="prop-badge-text">🧄 GARLIC CLOVE</text>
      </g>
    `,e.appendChild(Q(t))}}function Et(e,t,n){if(t.objectLoc[3]===22){let t=$(`Dusty Wizard's Cloak`,()=>n?.(`get cloak`));Z(t,`translate(420, 520)`),t.innerHTML+=`
      <!-- Wall peg -->
      <rect x="-6" y="-120" width="12" height="18" rx="3" fill="#78350f" stroke="#451a03" stroke-width="1.5"/>
      <!-- Cloak body hanging -->
      <path d="M -15 -110 Q 0 -115 15 -110 Q 50 -30 65 90 Q 0 105 -65 90 Q -50 -30 -15 -110 Z" 
            fill="#1e1b4b" stroke="#312e81" stroke-width="3" filter="url(#paperShadow)"/>
      <path d="M -5 -110 Q 0 20 0 95" fill="none" stroke="#3730a3" stroke-width="2.5"/>
      <!-- Celestial golden stars & crescent runes on cloak -->
      <path d="M -25 -40 L -23 -34 L -17 -34 L -22 -30 L -20 -24 L -25 -28 L -30 -24 L -28 -30 L -33 -34 L -27 -34 Z" fill="#fbbf24"/>
      <path d="M 25 20 L 27 25 L 32 25 L 28 29 L 30 34 L 25 31 L 20 34 L 22 29 L 18 25 L 23 25 Z" fill="#fbbf24"/>
      <path d="M 18 -60 A 10 10 0 1 0 32 -48 A 8 8 0 1 1 18 -60" fill="#fde047"/>

      <g class="prop-badge">
        <rect x="-60" y="-148" width="120" height="22" rx="11" fill="rgba(6, 9, 18, 0.95)" stroke="#6366f1" stroke-width="1.2"/>
        <text x="0" y="-133" text-anchor="middle" class="prop-badge-text">✨ WIZARD CLOAK</text>
      </g>
    `,e.appendChild(Q(t))}if(t.objectLoc[26]===22){let t=$(`Slender Lock Pick`,()=>n?.(`get pick`));Z(t,`translate(640, 720) rotate(20)`),t.innerHTML+=`
      <!-- Table surface shadow -->
      <ellipse cx="2" cy="8" rx="34" ry="8" fill="rgba(0,0,0,0.6)" filter="url(#paperShadow)"/>
      <!-- Slender tempered steel pick -->
      <rect x="-24" y="-3" width="48" height="6" rx="2" fill="url(#silverGrad)" stroke="#475569" stroke-width="1" filter="url(#goldGlint)"/>
      <path d="M 24 -3 L 34 -8 L 36 -6 L 27 2 Z" fill="url(#silverGrad)" stroke="#475569" stroke-width="1"/>
      <circle cx="-16" cy="0" r="2.5" fill="#0f172a"/>

      <g class="prop-badge" transform="rotate(-20)">
        <rect x="-44" y="-45" width="88" height="20" rx="10" fill="rgba(6, 9, 18, 0.9)" stroke="#94a3b8" stroke-width="1.2"/>
        <text x="0" y="-31" text-anchor="middle" class="prop-badge-text">🗝️ LOCK PICK</text>
      </g>
    `,e.appendChild(Q(t))}}function Dt(e,t,n){if(t.objectLoc[9]===24){let t=$(`Loaf of Stale Bread`,()=>n?.(`get bread`));Z(t,`translate(512, 680)`),t.innerHTML+=`
      <!-- Table cutting board -->
      <ellipse cx="0" cy="20" rx="60" ry="24" fill="#3b2617" stroke="#5a3d28" stroke-width="2" filter="url(#paperShadow)"/>
      <!-- Crusty bread loaf -->
      <ellipse cx="0" cy="0" rx="42" ry="24" fill="#d97706" stroke="#92400e" stroke-width="2" filter="url(#paperShadow)"/>
      <ellipse cx="0" cy="-6" rx="32" ry="16" fill="#f59e0b"/>
      <!-- Baker's scoring slashes -->
      <line x1="-20" y1="-14" x2="-10" y2="4" stroke="#78350f" stroke-width="3" stroke-linecap="round"/>
      <line x1="-5" y1="-16" x2="5" y2="4" stroke="#78350f" stroke-width="3" stroke-linecap="round"/>
      <line x1="10" y1="-14" x2="20" y2="4" stroke="#78350f" stroke-width="3" stroke-linecap="round"/>

      <g class="prop-badge">
        <rect x="-44" y="-55" width="88" height="20" rx="10" fill="rgba(6, 9, 18, 0.9)" stroke="#d97706" stroke-width="1.2"/>
        <text x="0" y="-41" text-anchor="middle" class="prop-badge-text">🍞 STALE BREAD</text>
      </g>
    `,e.appendChild(Q(t))}}function Ot(e,t,n){if(t.objectLoc[17]===25){let t=$(`Flintlock Pistol`,()=>n?.(`get pistol`));Z(t,`translate(512, 720) rotate(-8)`),t.innerHTML+=`
      <!-- Shadow on attic floorboards -->
      <ellipse cx="0" cy="18" rx="60" ry="16" fill="rgba(0,0,0,0.6)" filter="url(#paperShadow)"/>
      <!-- Wooden pistol stock -->
      <path d="M -45 28 Q -20 15 0 8 L 45 4 L 45 -4 L -5 -6 Q -35 -8 -45 28 Z" fill="#451a03" stroke="#2a1005" stroke-width="2"/>
      <circle cx="-42" cy="24" r="8" fill="#ca8a04" stroke="#78350f" stroke-width="1.5"/>
      <!-- Steel barrel -->
      <rect x="0" y="-4" width="55" height="7" rx="2" fill="url(#silverGrad)" stroke="#475569" stroke-width="1.5"/>
      <!-- Brass side plate and flint cock mechanism -->
      <rect x="-12" y="-12" width="16" height="12" rx="2" fill="#ca8a04" stroke="#854d0e" stroke-width="1"/>
      <path d="M -8 -12 L -6 -22 L 2 -18" fill="none" stroke="#64748b" stroke-width="3" stroke-linecap="round"/>
      <path d="M -15 8 Q -8 20 0 10" fill="none" stroke="#ca8a04" stroke-width="2"/>

      <g class="prop-badge" transform="rotate(8)">
        <rect x="-50" y="-62" width="100" height="22" rx="11" fill="rgba(6, 9, 18, 0.95)" stroke="#cbd5e1" stroke-width="1.2"/>
        <text x="0" y="-47" text-anchor="middle" class="prop-badge-text">🔫 FLINTLOCK</text>
      </g>
    `,e.appendChild(Q(t))}}function kt(e,t,n){if(t.objectLoc[10]===26){let t=$(`Sneering Goblin with Key`,()=>n?.(`say ijnid`));Z(t,`translate(512, 740)`),t.innerHTML+=`
      <!-- Sand shadow -->
      <ellipse cx="0" cy="0" rx="70" ry="20" fill="rgba(0,0,0,0.5)" filter="url(#paperShadow)"/>

      <image href="art/props/goblin.webp" x="-96" y="-300" width="192" height="300" filter="url(#paperShadow)"/>

      <g class="prop-badge">
        <rect x="-65" y="-330" width="130" height="22" rx="11" fill="rgba(6, 9, 18, 0.95)" stroke="#65a30d" stroke-width="1.2"/>
        <text x="0" y="-315" text-anchor="middle" class="prop-badge-text">👺 SNEERING GOBLIN</text>
      </g>
    `,e.appendChild(Q(t));return}if(t.objectLoc[11]===26){let t=$(`Tiny Gleaming Key`,()=>n?.(`get key`));Z(t,`translate(512, 750) rotate(-24)`),t.innerHTML+=`
      <!-- Sand shadow -->
      <ellipse cx="4" cy="8" rx="26" ry="10" fill="rgba(0,0,0,0.5)" filter="url(#paperShadow)"/>

      <!-- Golden key bow & shaft -->
      <circle cx="-16" cy="0" r="14" fill="url(#goldKeyGrad)" stroke="#78350f" stroke-width="1.8" filter="url(#goldGlint)"/>
      <circle cx="-16" cy="0" r="7" fill="#451a03"/>
      <rect x="-4" y="-3.5" width="34" height="7" rx="2" fill="url(#goldKeyGrad)" stroke="#78350f" stroke-width="1.5" filter="url(#goldGlint)"/>
      <!-- Key teeth -->
      <rect x="18" y="3.5" width="5" height="10" fill="url(#goldKeyGrad)" stroke="#78350f" stroke-width="1.2"/>
      <rect x="25" y="3.5" width="5" height="7" fill="url(#goldKeyGrad)" stroke="#78350f" stroke-width="1.2"/>

      <!-- Sparkle stars -->
      <path d="M 32 -10 L 34 -5 L 39 -3 L 34 -1 L 32 4 L 30 -1 L 25 -3 L 30 -5 Z" fill="#fef08a" filter="url(#goldGlint)"/>
      <path d="M -30 -16 L -29 -12 L -25 -11 L -29 -10 L -30 -6 L -31 -10 L -35 -11 L -31 -12 Z" fill="#fef08a" filter="url(#goldGlint)"/>

      <g class="prop-badge" transform="rotate(24)">
        <rect x="-40" y="-55" width="80" height="20" rx="10" fill="rgba(6, 9, 18, 0.9)" stroke="#f59e0b" stroke-width="1.2"/>
        <text x="0" y="-41" text-anchor="middle" class="prop-badge-text">🔑 TINY KEY</text>
      </g>
    `,e.appendChild(Q(t))}}function At(e,t,n){if(t.flags.WF===1){let t=$(`Pile of Werewolf Ashes`,()=>n?.(`look ash`));Z(t,`translate(512, 750)`),t.innerHTML+=`
      <!-- Ash mound shadow -->
      <ellipse cx="0" cy="18" rx="80" ry="24" fill="rgba(0,0,0,0.6)" filter="url(#paperShadow)"/>
      <!-- Gray ash mound -->
      <ellipse cx="0" cy="0" rx="72" ry="20" fill="#27272a" stroke="#18181b" stroke-width="2"/>
      <ellipse cx="-15" cy="-4" rx="40" ry="14" fill="#3f3f46"/>
      <ellipse cx="20" cy="2" rx="35" ry="12" fill="#18181b"/>

      <!-- Smoldering red embers scattered in ash -->
      <circle cx="-30" cy="2" r="3" fill="#ef4444" filter="url(#runeGlow)" class="ember-particle"/>
      <circle cx="-10" cy="-6" r="2.5" fill="#f97316" filter="url(#runeGlow)"/>
      <circle cx="15" cy="-2" r="3" fill="#ef4444" filter="url(#runeGlow)" class="ember-particle"/>
      <circle cx="35" cy="4" r="2" fill="#f97316"/>

      <!-- Faint wisps of rising gray smoke -->
      <path d="M -15 -10 Q -25 -30 -15 -45 Q -5 -60 -15 -75" fill="none" stroke="#71717a" stroke-width="2.5" opacity="0.4" stroke-linecap="round"/>
      <path d="M 15 -8 Q 5 -25 20 -40 Q 30 -55 20 -70" fill="none" stroke="#94a3b8" stroke-width="2" opacity="0.35" stroke-linecap="round"/>

      <g class="prop-badge">
        <rect x="-65" y="-70" width="130" height="22" rx="11" fill="rgba(6, 9, 18, 0.95)" stroke="#71717a" stroke-width="1.2"/>
        <text x="0" y="-55" text-anchor="middle" class="prop-badge-text">⚱️ WEREWOLF ASHES</text>
      </g>
    `,e.appendChild(Q(t))}}function jt(e,t,n){if(t.objectLoc[31]===29){let t=$(`Piece of Flypaper`,()=>n?.(`get flypaper`));Z(t,`translate(660, 480)`),t.innerHTML+=`
      <!-- Ceiling thumbtack -->
      <circle cx="0" cy="-80" r="4" fill="#b91c1c" stroke="#450a0a" stroke-width="1"/>
      <!-- Sticky amber coiled fly ribbon -->
      <path d="M 0 -80 Q 12 -40 -8 0 Q 15 40 -6 80 Q 8 110 0 130" fill="none" stroke="#d97706" stroke-width="10" stroke-linecap="round" opacity="0.85" filter="url(#paperShadow)"/>
      <path d="M 0 -80 Q 12 -40 -8 0 Q 15 40 -6 80 Q 8 110 0 130" fill="none" stroke="#fde68a" stroke-width="6" stroke-linecap="round" opacity="0.6"/>
      <!-- Trapped fly specks -->
      <circle cx="-3" cy="-20" r="2.5" fill="#000"/>
      <circle cx="5" cy="25" r="2" fill="#000"/>
      <circle cx="-2" cy="70" r="2.5" fill="#000"/>

      <g class="prop-badge">
        <rect x="-50" y="-115" width="100" height="20" rx="10" fill="rgba(6, 9, 18, 0.9)" stroke="#d97706" stroke-width="1"/>
        <text x="0" y="-101" text-anchor="middle" class="prop-badge-text">🪰 FLYPAPER</text>
      </g>
    `,e.appendChild(Q(t))}}function Mt(e,t,n){if(t.flags.VR===1){let t=$(`Smoldering Vampire Embers`,()=>n?.(`look embers`));Z(t,`translate(512, 740)`),t.innerHTML+=`
      <!-- Scorch mark on floor -->
      <ellipse cx="0" cy="18" rx="85" ry="26" fill="rgba(0,0,0,0.65)" filter="url(#paperShadow)"/>
      <ellipse cx="0" cy="0" rx="78" ry="22" fill="#450a0a" stroke="#7f1d1d" stroke-width="2" filter="url(#emberGlow)"/>

      <!-- Burnt cloak shreds -->
      <polygon points="-50,5 -35,-15 -20,10" fill="#09090b" stroke="#18181b"/>
      <polygon points="25,8 45,-12 38,12" fill="#09090b" stroke="#18181b"/>

      <!-- Glowing burning dust and fiery embers -->
      <ellipse cx="0" cy="-2" rx="45" ry="14" fill="#991b1b" opacity="0.85"/>
      <circle cx="-25" cy="-2" r="3.5" fill="#f97316" filter="url(#runeGlow)" class="ember-particle"/>
      <circle cx="-5" cy="4" r="4" fill="#ef4444" filter="url(#runeGlow)"/>
      <circle cx="10" cy="-4" r="3.5" fill="#fbbf24" filter="url(#runeGlow)" class="ember-particle"/>
      <circle cx="28" cy="2" r="3" fill="#f97316" filter="url(#runeGlow)"/>

      <!-- Rising crimson sparks and smoke -->
      <path d="M 0 -12 Q -15 -35 0 -55 Q 10 -75 0 -95" fill="none" stroke="#ef4444" stroke-width="2" opacity="0.5" stroke-linecap="round"/>
      <circle cx="-8" cy="-40" r="1.5" fill="#fde047" opacity="0.8"/>
      <circle cx="12" cy="-60" r="1.5" fill="#fde047" opacity="0.7"/>

      <g class="prop-badge">
        <rect x="-65" y="-75" width="130" height="22" rx="11" fill="rgba(6, 9, 18, 0.95)" stroke="#ef4444" stroke-width="1.2"/>
        <text x="0" y="-60" text-anchor="middle" class="prop-badge-text">🔥 VAMPIRE EMBERS</text>
      </g>
    `,e.appendChild(Q(t))}}function Nt(e,t,n){let r=t.objectLoc[4]===35,i=t.objectLoc[5]===35,a=$(r?i?`Open Coffer with Shiny Ring`:`Open Coffer`:`Locked Treasure Coffer`,()=>n?.(r?i?`get ring`:`look coffer`:`open coffer`));Z(a,`translate(512, 720)`),r?a.innerHTML+=`
      <!-- Open coffer chest base -->
      <rect x="-90" y="-10" width="180" height="85" rx="6" fill="#3b2617" stroke="#b45309" stroke-width="3" filter="url(#paperShadow)"/>
      
      <!-- Open lid tilted upward -->
      <polygon points="-94,-10 94,-10 80,-65 -80,-65" fill="#451a03" stroke="#b45309" stroke-width="2.5"/>
      <rect x="-82" y="-62" width="164" height="48" fill="#1c0f06"/>

      <!-- Mound of glowing gold coins -->
      <ellipse cx="0" cy="18" rx="72" ry="24" fill="#eab308" stroke="#713f12" stroke-width="1.5"/>
      <circle cx="-35" cy="12" r="7" fill="#facc15" stroke="#713f12" stroke-width="1"/>
      <circle cx="-15" cy="8" r="8" fill="#fef08a" stroke="#713f12" stroke-width="1"/>
      <circle cx="20" cy="14" r="7" fill="#facc15" stroke="#713f12" stroke-width="1"/>
      <circle cx="38" cy="18" r="8" fill="#fef08a" stroke="#713f12" stroke-width="1"/>

      ${i?`
        <!-- Shiny Ring resting on top of gold -->
        <g filter="url(#goldGlint)" transform="translate(0, 4)">
          <ellipse cx="0" cy="0" rx="14" ry="9" fill="none" stroke="#fef08a" stroke-width="3.5"/>
          <!-- Gemstone sparkle -->
          <polygon points="0,-12 6,-6 0,0 -6,-6" fill="#38bdf8" stroke="#ffffff" stroke-width="1"/>
          <circle cx="0" cy="-6" r="3" fill="#ffffff"/>
        </g>
        <g class="prop-badge">
          <rect x="-50" y="-95" width="100" height="22" rx="11" fill="rgba(6, 9, 18, 0.95)" stroke="#38bdf8" stroke-width="1.2"/>
          <text x="0" y="-80" text-anchor="middle" class="prop-badge-text">💍 SHINY RING</text>
        </g>
      `:`
        <g class="prop-badge">
          <rect x="-56" y="-95" width="112" height="22" rx="11" fill="rgba(6, 9, 18, 0.9)" stroke="#eab308" stroke-width="1.2"/>
          <text x="0" y="-80" text-anchor="middle" class="prop-badge-text">🪙 OPEN COFFER</text>
        </g>
      `}
    `:a.innerHTML+=`
      <rect x="-85" y="-30" width="170" height="90" rx="8" fill="#3b2617" stroke="#78350f" stroke-width="3" filter="url(#paperShadow)"/>
      <rect x="-85" y="-12" width="170" height="8" fill="#b45309"/>
      <!-- Iron bands -->
      <line x1="-50" y1="-30" x2="-50" y2="60" stroke="#71717a" stroke-width="4"/>
      <line x1="50" y1="-30" x2="50" y2="60" stroke="#71717a" stroke-width="4"/>
      <!-- Lock clasp -->
      <rect x="-14" y="-8" width="28" height="22" rx="3" fill="#ca8a04" stroke="#713f12" stroke-width="1.5"/>

      <g class="prop-badge">
        <rect x="-56" y="-62" width="112" height="22" rx="11" fill="rgba(6, 9, 18, 0.9)" stroke="#ca8a04" stroke-width="1.2"/>
        <text x="0" y="-47" text-anchor="middle" class="prop-badge-text">📦 COFFER</text>
      </g>
    `,e.appendChild(Q(a))}function Pt(e,t,n){if(t.objectLoc[38]===37){let t=$(`Princess Sabrina (Awake)`,()=>n?.(`talk princess`));Z(t,`translate(512, 740)`),t.innerHTML+=`
      <!-- Aura of liberation -->
      <ellipse cx="0" cy="-190" rx="100" ry="190" fill="none" stroke="#f472b6" stroke-width="2.5" opacity="0.7" filter="url(#saucerGlow)"/>

      <image href="art/props/sabrina.webp" x="-102" y="-460" width="205" height="460" filter="url(#paperShadow)"/>

      <g class="prop-badge">
        <rect x="-64" y="-490" width="128" height="22" rx="11" fill="rgba(6, 9, 18, 0.95)" stroke="#f43f5e" stroke-width="1.2"/>
        <text x="0" y="-475" text-anchor="middle" class="prop-badge-text">👸 PRINCESS SABRINA</text>
      </g>
    `,e.appendChild(Q(t))}}function Ft(e,t,n){let r=t.objectLoc[19]===38,i=t.objectLoc[22]===38,a=$(r?`Open Wooden Coffin`:`Closed Wooden Coffin`,()=>n?.(r?i?`get bullet`:`look coffin`:`open coffin`));Z(a,`translate(512, 700)`),r?a.innerHTML+=`
      <!-- Open coffin base -->
      <polygon points="-120,-35 120,-35 90,60 -90,60" fill="#18181b" stroke="#3f3f46" stroke-width="3" filter="url(#paperShadow)"/>
      <polygon points="-110,-28 110,-28 82,52 -82,52" fill="#09090b"/>

      <!-- Rotting corpse silhouette -->
      <g opacity="0.85">
        <circle cx="-55" cy="8" r="14" fill="#a1a1aa" stroke="#52525b" stroke-width="1.5"/>
        <rect x="-35" y="-2" width="95" height="24" rx="4" fill="#3f3f46"/>
        <!-- Skeletal rib lines -->
        <line x1="-25" y1="2" x2="-25" y2="18" stroke="#d4d4d8" stroke-width="1.5"/>
        <line x1="-12" y1="2" x2="-12" y2="18" stroke="#d4d4d8" stroke-width="1.5"/>
        <line x1="2" y1="2" x2="2" y2="18" stroke="#d4d4d8" stroke-width="1.5"/>
      </g>

      <!-- Coffin lid thrown aside -->
      <polygon points="60,-75 140,-5 120,40 40,-30" fill="#3b2617" stroke="#1c0f06" stroke-width="2.5" opacity="0.95"/>

      ${i?`
        <!-- Gleaming Silver Bullet -->
        <g filter="url(#goldGlint)" transform="translate(48, 20) rotate(-15)">
          <rect x="-8" y="-4" width="18" height="8" rx="2" fill="url(#silverGrad)" stroke="#cbd5e1" stroke-width="1"/>
          <path d="M 10 -4 Q 16 0 10 4 Z" fill="url(#silverGrad)"/>
        </g>
        <g class="prop-badge">
          <rect x="-56" y="-85" width="112" height="22" rx="11" fill="rgba(6, 9, 18, 0.95)" stroke="#38bdf8" stroke-width="1.2"/>
          <text x="0" y="-70" text-anchor="middle" class="prop-badge-text">🥈 SILVER BULLET</text>
        </g>
      `:`
        <g class="prop-badge">
          <rect x="-54" y="-85" width="108" height="22" rx="11" fill="rgba(6, 9, 18, 0.9)" stroke="#71717a" stroke-width="1.2"/>
          <text x="0" y="-70" text-anchor="middle" class="prop-badge-text">⚰️ OPEN COFFIN</text>
        </g>
      `}
    `:a.innerHTML+=`
      <polygon points="-120,-35 120,-35 90,60 -90,60" fill="#3b2617" stroke="#23140a" stroke-width="3.5" filter="url(#paperShadow)"/>
      <polygon points="-108,-28 108,-28 80,50 -80,50" fill="#451a03" stroke="#23140a" stroke-width="1.5"/>
      <!-- Cross carving on lid -->
      <rect x="-6" y="-12" width="12" height="42" rx="2" fill="#23140a"/>
      <rect x="-18" y="-4" width="36" height="10" rx="2" fill="#23140a"/>

      <g class="prop-badge">
        <rect x="-56" y="-68" width="112" height="22" rx="11" fill="rgba(6, 9, 18, 0.9)" stroke="#b45309" stroke-width="1.2"/>
        <text x="0" y="-53" text-anchor="middle" class="prop-badge-text">⚰️ CLOSED COFFIN</text>
      </g>
    `,e.appendChild(Q(a))}function It(e,t,n){let r=$(`Ravenous Mice`,()=>n?.(`look mice`));Z(r,`translate(512, 820)`),r.innerHTML+=`
    <!-- Mouse 1: Left mouse facing right -->
    <g transform="translate(-65, 0)">
      <ellipse cx="0" cy="12" rx="22" ry="7" fill="rgba(0,0,0,0.4)" filter="url(#paperShadow)"/>
      <ellipse cx="0" cy="5" rx="20" ry="11" fill="#64748b" stroke="#334155" stroke-width="1.2"/>
      <ellipse cx="16" cy="2" rx="8" ry="6" fill="#64748b"/>
      <circle cx="21" cy="0" r="2" fill="#0f172a"/>
      <!-- Pink ear -->
      <circle cx="10" cy="-3" r="4.5" fill="#fda4af" stroke="#e2e8f0" stroke-width="0.8"/>
      <!-- Long curving pink tail -->
      <path d="M -18 7 Q -32 5 -38 -8 Q -42 -18 -36 -24" fill="none" stroke="#f472b6" stroke-width="2.2" stroke-linecap="round"/>
      <!-- Whiskers -->
      <line x1="20" y1="2" x2="30" y2="-2" stroke="#cbd5e1" stroke-width="1"/>
      <line x1="20" y1="4" x2="29" y2="7" stroke="#cbd5e1" stroke-width="1"/>
    </g>

    <!-- Mouse 2: Center mouse sniffing upward -->
    <g transform="translate(0, -10)">
      <ellipse cx="0" cy="14" rx="18" ry="6" fill="rgba(0,0,0,0.4)" filter="url(#paperShadow)"/>
      <ellipse cx="0" cy="4" rx="16" ry="12" fill="#475569" stroke="#1e293b" stroke-width="1.2"/>
      <ellipse cx="2" cy="-6" rx="9" ry="7" fill="#475569"/>
      <circle cx="2" cy="-11" r="2.5" fill="#ef4444"/>
      <!-- Pink ears -->
      <circle cx="-5" cy="-9" r="4" fill="#fda4af"/>
      <circle cx="8" cy="-9" r="4" fill="#fda4af"/>
      <!-- Tail -->
      <path d="M -12 10 Q -24 16 -30 8 Q -34 0 -28 -6" fill="none" stroke="#f472b6" stroke-width="2" stroke-linecap="round"/>
    </g>

    <!-- Mouse 3: Right mouse darting forward -->
    <g transform="translate(60, 5)">
      <ellipse cx="0" cy="10" rx="20" ry="6" fill="rgba(0,0,0,0.4)" filter="url(#paperShadow)"/>
      <ellipse cx="0" cy="4" rx="18" ry="9" fill="#64748b" stroke="#334155" stroke-width="1.2"/>
      <ellipse cx="14" cy="2" rx="7" ry="5" fill="#64748b"/>
      <circle cx="18" cy="1" r="1.8" fill="#0f172a"/>
      <circle cx="9" cy="-2" r="4" fill="#fda4af"/>
      <path d="M -16 6 Q -28 8 -34 2 Q -38 -6 -32 -12" fill="none" stroke="#f472b6" stroke-width="2.2" stroke-linecap="round"/>
      <line x1="17" y1="2" x2="26" y2="0" stroke="#cbd5e1" stroke-width="1"/>
    </g>

    <g class="prop-badge">
      <rect x="-60" y="-45" width="120" height="22" rx="11" fill="rgba(6, 9, 18, 0.95)" stroke="#94a3b8" stroke-width="1.2"/>
      <text x="0" y="-30" text-anchor="middle" class="prop-badge-text">🐀 RAVENOUS MICE</text>
    </g>
  `,e.appendChild(Q(r))}function Lt(e,t,n){let r=$(`Snarling Werewolf`,()=>n?.(`shoot werewolf`));Z(r,`translate(512, 740)`),r.innerHTML+=`
    <!-- Menacing dark shadow -->
    <ellipse cx="0" cy="0" rx="110" ry="30" fill="rgba(0,0,0,0.75)" filter="url(#paperShadow)"/>

    <!-- Red beast threat aura -->
    <ellipse cx="0" cy="-190" rx="130" ry="190" fill="none" stroke="#dc2626" stroke-width="3" opacity="0.6" filter="url(#bloodGlow)"/>

    <image href="art/props/werewolf.webp" x="-230" y="-460" width="460" height="460" filter="url(#paperShadow)"/>

    <g class="prop-badge">
      <rect x="-70" y="-490" width="140" height="24" rx="12" fill="rgba(6, 9, 18, 0.95)" stroke="#ef4444" stroke-width="1.4"/>
      <text x="0" y="-474" text-anchor="middle" class="prop-badge-text">🐺 SNARLING WEREWOLF</text>
    </g>
  `,e.appendChild(Q(r))}function Rt(e,t,n){let r=$(`Lethal Vampire`,()=>n?.(`wave cross`));Z(r,`translate(512, 740)`),r.innerHTML+=`
    <!-- Shadow -->
    <ellipse cx="0" cy="0" rx="90" ry="26" fill="rgba(0,0,0,0.8)" filter="url(#paperShadow)"/>

    <!-- Hypnotic supernatural aura -->
    <ellipse cx="0" cy="-190" rx="110" ry="190" fill="none" stroke="#991b1b" stroke-width="2.5" opacity="0.65" filter="url(#bloodGlow)"/>

    <image href="art/props/vampire.webp" x="-226" y="-480" width="452" height="480" filter="url(#paperShadow)"/>

    <g class="prop-badge">
      <rect x="-65" y="-510" width="130" height="24" rx="12" fill="rgba(6, 9, 18, 0.95)" stroke="#dc2626" stroke-width="1.4"/>
      <text x="0" y="-494" text-anchor="middle" class="prop-badge-text">🧛 VAMPIRE LORD</text>
    </g>
  `,e.appendChild(Q(r))}function zt(e,{roomId:t,state:n,world:r,onAction:i}){if(e){switch(e.innerHTML=gt,t){case 3:_t(e,n,i);break;case 4:vt(e,n,i);break;case 5:yt(e,n,i);break;case 7:bt(e,n,i);break;case 9:xt(e,n,i);break;case 10:break;case 11:Ct(e,n,i);break;case 15:wt(e,n,i);break;case 16:St(e,n,i);break;case 20:Tt(e,n,i);break;case 22:Et(e,n,i);break;case 24:Dt(e,n,i);break;case 25:Ot(e,n,i);break;case 26:kt(e,n,i);break;case 27:At(e,n,i);break;case 29:jt(e,n,i);break;case 30:Mt(e,n,i);break;case 35:Nt(e,n,i);break;case 37:Pt(e,n,i);break;case 38:Ft(e,n,i)}n.objectLoc[20]===t&&It(e,n,i),n.objectLoc[34]===t&&!n.flags.WF&&Lt(e,n,i),n.objectLoc[39]===t&&!n.flags.VR&&Rt(e,n,i)}}var Bt={1:[`#0d3311`,`#7fd18b`],2:[`#1a1a2e`,`#8b8bd1`],4:[`#331a0d`,`#d1a67f`],5:[`#330d1f`,`#d17fa6`],6:[`#222`,`#aaa`],7:[`#101`,`#5ff`],8:[`#000`,`#333`]},Vt=Bt[1],Ht={1:e=>e.flags.SM?`-runes`:``,9:e=>e.flags.DR?`-open`:``,10:e=>e.flags.DR?`-open`:``,4:e=>e.objectLoc[2]===-1?`-burnt`:``,37:e=>e.objectLoc[16]===37?`-open`:e.objectLoc[15]===37?`-sarcophagus`:e.objectLoc[38]===-1?``:`-empty`},Ut=`transylvania-art-mode`;function Wt(e,t,n=`enhanced`){let r=t?Ht[e.id]?.(t)??``:``,i=[`art/room-${e.id}${r}.webp`,`art/room-${e.id}.webp`,`art/room-${e.id}.png`];return n===`classic`?[`art/classic/room-${e.id}.webp`,...i]:i}function Gt(e,t,n,r){let i=document.createElement(`img`);i.className=`scene-art`,i.alt=``,e.prepend(i);let a=document.getElementById(`sceneBackdrop`),o=(()=>{try{return localStorage.getItem(Ut)===`classic`?`classic`:`enhanced`}catch{return`enhanced`}})(),s=null;function c(t){i.style.display=`none`;let[n,r]=Bt[t.type]??Vt;e.style.background=`radial-gradient(circle at 50% 30%, ${r}, ${n} 70%)`,a&&(a.style.backgroundImage=`none`,a.style.background=`radial-gradient(circle at 50% 50%, ${r}, ${n} 80%)`,a.style.opacity=`0.35`)}return i.onload=()=>{a&&i.src&&(a.style.backgroundImage=`url("${i.src}")`,a.style.opacity=`0.45`)},{show(a,l,u){s={room:a,state:l,world:u};let d=Wt(a,l,o);e.style.background=`#000`,i.style.display=`block`;function f(){let e=d.shift();e?i.src=e:c(a)}i.onerror=f,f(),n&&l&&u&&zt(n,{roomId:a.id,state:l,world:u,onAction:r}),t.textContent=`ROOM ${a.id} · TYPE ${a.type}`},getArtMode(){return o},toggleArtMode(){o=o===`classic`?`enhanced`:`classic`;try{localStorage.setItem(Ut,o)}catch{}return s&&this.show(s.room,s.state,s.world),o}}}function Kt(e,t,n){if(!e||!t||!n)return[];let r=[],i=e.id;t.objectLoc[34]===i&&!t.flags?.WF&&r.push({cmd:`shoot werewolf`,label:`SHOOT WEREWOLF`,icon:`🐺`,danger:!0}),t.objectLoc[39]===i&&!t.flags?.VR&&u(t,6)&&r.push({cmd:`wave cross`,label:`WAVE CROSS`,icon:`✝️`,danger:!0}),t.objectLoc[20]===i&&u(t,25)&&r.push({cmd:`wave broom`,label:`WAVE BROOM`,icon:`🧹`});let a=A(n,t,i);for(let e of a)if(m(n,t,e.id)){if(i===7&&t.objectLoc[24]===7&&(e.id===1||e.id===25))continue;let a=f(n,t,e.id),o=`📦`,s=`get ${a.toLowerCase().replace(/\.$/,``)}`;e.id===18?(o=`📜`,s=`get note`):e.id===20?(o=`🐀`,s=`get mice`):e.id===32?(o=`🧄`,s=`get garlic`):e.id===3?(o=`🧥`,s=`get cloak`):e.id===26?(o=`🗝️`,s=`get pick`):e.id===17?(o=`🔫`,s=`get pistol`):e.id===22?(o=`⚪`,s=`get bullet`):e.id===6?(o=`✝️`,s=`get cross`):e.id===31?(o=`🪰`,s=`get flypaper`):e.id===11?(o=`🔑`,s=`get key`):e.id===36?(o=`🧪`,s=`get elixir`):e.id===25?(o=`🧹`,s=`get broom`):e.id===1?(o=`🧪`,s=`get acid`):e.id===9?(o=`🍞`,s=`get bread`):e.id===5&&(o=`💍`,s=`get ring`),r.push({cmd:s,label:`GET ${a.replace(/\.$/,``).toUpperCase()}`,icon:o})}i===1?(r.push({cmd:`look stump`,label:`LOOK STUMP`,icon:`🪵`}),t.flags?.SM&&(r.push({cmd:`go stump`,label:`ENTER STUMP`,icon:`🚪`}),r.push({cmd:`knock stump`,label:`KNOCK STUMP`,icon:`🚪`}))):i===4?r.push({cmd:`look statue`,label:`LOOK STATUE`,icon:`🛸`}):i===5?!t.flags?.GT&&t.objectLoc[13]!==5?r.push({cmd:`open grate`,label:`OPEN GRATE`,icon:`🕳️`}):r.push({cmd:`down`,label:`CLIMB DOWN`,icon:`🕳️`}):i===9||i===10?(i===9&&t.objectLoc[7]===9&&r.push({cmd:`look flies`,label:`LOOK FLIES`,icon:`🪰`}),i===9&&t.objectLoc[31]===9&&r.push({cmd:`get flypaper`,label:`GET FLYPAPER`,icon:`🪰`}),t.flags?.DR?r.push({cmd:`go door`,label:`GO DOOR`,icon:`🚪`}):r.push({cmd:`open door`,label:`OPEN DOOR`,icon:`🚪`})):i===7?t.objectLoc[24]===7&&r.push({cmd:`look cat`,label:`LOOK CAT`,icon:`🐱`}):i===16?r.push({cmd:`look frog`,label:`LOOK FROG`,icon:`🐸`}):i===21?(r.push({cmd:`look antlers`,label:`LOOK ANTLERS`,icon:`🦌`}),r.push({cmd:`pull antlers`,label:`PULL ANTLERS`,icon:`🦌`})):i===22?r.push({cmd:`pull wall`,label:`REVOLVE WALL`,icon:`🔄`}):i===24||i===38?r.push({cmd:`open coffin`,label:`OPEN COFFIN`,icon:`⚰️`}):i===25||i===33?(r.push({cmd:`board boat`,label:`BOARD BOAT`,icon:`⛵`}),r.push({cmd:`sail boat`,label:`SAIL BOAT`,icon:`⛵`})):i===26?r.push({cmd:`look goblin`,label:`LOOK GOBLIN`,icon:`👺`}):i===37&&(t.flags?.SH?t.flags?.PO?r.push({cmd:`look damsel`,label:`LOOK SABRINA`,icon:`👸`}):r.push({cmd:`open coffin`,label:`OPEN COFFIN`,icon:`⚰️`}):r.push({cmd:`cut vines`,label:`PULL VINES`,icon:`🌿`})),u(t,18)&&r.push({cmd:`read note`,label:`READ NOTE`,icon:`📖`}),u(t,17)&&u(t,22)&&r.push({cmd:`load pistol`,label:`LOAD PISTOL`,icon:`⚙️`}),u(t,3)&&r.push({cmd:`wear cloak`,label:`WEAR CLOAK`,icon:`🧥`}),u(t,25)&&t.objectLoc[24]!==i&&r.push({cmd:`ride broom`,label:`RIDE BROOM`,icon:`🧹`}),r.length<3&&(r.push({cmd:`look`,label:`LOOK AROUND`,icon:`👁️`}),r.push({cmd:`inventory`,label:`INVENTORY`,icon:`🎒`}));let o=new Set,s=[];for(let e of r)o.has(e.cmd)||(o.add(e.cmd),s.push(e));return s}function qt({onCommand:e}){let t=document.getElementById(`log`),n=document.getElementById(`cmd`),r=document.getElementById(`go`),i=document.getElementById(`actionChips`),a=document.querySelectorAll(`.dpad-btn`),o=document.querySelectorAll(`.quick-btn`),s=document.getElementById(`dirs`);function c(){let t=n.value;n.value=``,n.focus(),e(t)}if(r&&r.addEventListener(`click`,c),n&&n.addEventListener(`keydown`,e=>{e.key===`Enter`&&c()}),a.forEach(t=>{let n=t.dataset.dir,r=t.dataset.cmd;t.addEventListener(`click`,()=>{n?e(n):r&&e(r)})}),o.forEach(t=>{let n=t.dataset.cmd;n&&t.addEventListener(`click`,()=>e(n))}),s&&s.children.length===0)for(let t of[`N`,`S`,`W`,`E`,`U`,`D`,`LOOK`,`MAP`,`INVENTORY`]){let n=document.createElement(`button`);n.textContent=t,n.addEventListener(`click`,()=>e(t.toLowerCase())),s.append(n)}function l(e,t){if(!e)return;let n=e.exits||{},r={n:n.N>0,s:n.S>0,w:n.W>0,e:n.E>0,u:n.U>0,d:n.D>0||e.id===5&&!!t?.flags?.GT};a.forEach(e=>{let t=e.dataset.dir;t&&t in r&&(r[t]?(e.classList.add(`active-exit`),e.classList.remove(`disabled-exit`),e.setAttribute(`aria-disabled`,`false`)):(e.classList.remove(`active-exit`),e.classList.add(`disabled-exit`),e.setAttribute(`aria-disabled`,`true`)))})}function u(t,n,r){if(!i)return;let a=Kt(t,n,r);i.replaceChildren(...a.map(t=>{let n=document.createElement(`button`);return n.type=`button`,n.className=`action-chip ${t.danger?`danger`:``}`,n.innerHTML=`${t.icon?`<span class="chip-icon">${t.icon}</span>`:``}<span class="chip-label">${t.label}</span>`,n.addEventListener(`click`,()=>{e(t.cmd)}),n}))}return{print(e){t&&e.length!==0&&(t.textContent+=`${e.join(`
`)}\n`,t.scrollTop=t.scrollHeight)},echo(e){this.print([`> ${e}`])},clear(){t&&(t.textContent=``,t.scrollTop=0)},focus(){n&&n.focus()},update({room:e,state:t,world:n}){l(e,t),u(e,t,n)}}}async function Jt(){let e=Ye(await n(),{randomEvents:!0,debugInventory:q()}),t=e=>{},r=Gt(document.getElementById(`scene`),document.getElementById(`sceneLabel`),document.getElementById(`sceneOverlay`),e=>t(e)),i=at(document.getElementById(`scene`),document.getElementById(`log`)),a=document.getElementById(`mapToggle`),o=document.getElementById(`artToggle`),s=document.getElementById(`artToggleLabel`);function c(){if(!o)return;let e=r.getArtMode()===`classic`;o.classList.toggle(`active`,e),s&&(s.textContent=e?`1982`:`CLASSIC`),o.title=e?`Switch to illustrated graphics`:`Switch to 1982 Apple II graphics`}o&&(o.addEventListener(`click`,()=>{r.toggleArtMode(),c()}),c());let l=document.getElementById(`debugToggle`);l&&(l.classList.toggle(`active`,q()),l.addEventListener(`click`,()=>{$e(),location.reload()}));let u=ht({miniMapElement:document.getElementById(`miniMap`),miniMapViewport:document.getElementById(`miniMapViewport`),miniMapBadge:document.getElementById(`miniMapBadge`),drawerElement:document.getElementById(`mapDrawer`),drawerBody:document.getElementById(`mapDrawerBody`),drawerStats:document.getElementById(`mapDrawerStats`),drawerClose:document.getElementById(`mapDrawerClose`),drawerBackdrop:document.getElementById(`mapDrawerBackdrop`)});a&&a.addEventListener(`click`,()=>{u.toggle()});function d(){u.update({currentRoom:e.state.room,visitedRooms:e.getVisitedRooms(),world:e.world,state:e.state})}let f,p=()=>{let t=e.world.room(e.state.room);r.show(t,e.state,e.world),d(),f&&f.update({room:t,state:e.state,world:e.world})},m=Ze({engine:e,onJump:p}),h=e.state.room;function g(){e.state.room!==h&&(h=e.state.room,f.clear())}let _=document.getElementById(`turnBadge`);function v(){_&&(_.textContent=`TURN ${e.state.turns}`)}t=function(t){let n=t.trim().toLowerCase();n===`map`||n===`m`?u.open():(n===`scene`||n===`close`&&u.isOpen())&&u.close();let r=m.handle(t);if(r!==null){Promise.resolve(r).then(e=>{g(),f.echo(t),f.print(e),v(),d(),p()});return}i.prime();let{echo:a,messages:o,events:s}=e.execute(t);a!==null&&(g(),f.echo(a),f.print(o),p(),v(),s?.length&&i.play(s))},f=qt({onCommand:t}),f.print(e.start()),v(),d();let y=m.initialRoom();y!==null&&(e.state.room=y,g(),f.print([`DEBUG: resumed at room ${y}`,e.world.room(y).desc])),p(),f.focus()}Jt().catch(e=>{console.error(e);let t=document.getElementById(`log`);t&&(t.textContent+=`\nFAILED TO START: ${e.message}\n`)});