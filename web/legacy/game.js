// v0.1 engine: movement + look + get/drop/inventory using extracted game.json
// Faithful to TRANS.bas: P=room, P%(id)=loc (-2 carried, -1 gone), H=count max 5, D%=exits.
let DB=null, P=1, H=0, TU=0;
const loc={}; // objId -> room | -2 | -1
const logEl=()=>document.getElementById('log');
function print(t){ const el=logEl(); el.textContent+=t+"\n"; el.scrollTop=el.scrollHeight; }
function room(id){ return DB.rooms.find(r=>r.id===id); }
function objsHere(){ return DB.objects.filter(o=>loc[o.id]===P); }
function carried(){ return DB.objects.filter(o=>loc[o.id]===-2); }
function exitsStr(r){
  const e=[]; if(r.exits.N)e.push("N."); if(r.exits.S)e.push("S.");
  if(r.exits.W)e.push("W."); if(r.exits.E)e.push("E.");
  if(r.exits.U)e.push("U."); if(r.exits.D)e.push("D.");
  return e.join(" ")||"(none — special exit, see full TRANS scripts)";
}
function paintScene(){
  const r=room(P);
  const s=document.getElementById('scene');
  let img=document.getElementById('sceneImg');
  if(!img){
    img=document.createElement('img');
    img.id='sceneImg';
    img.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:cover';
    s.prepend(img);
  }
  const trySrc=[`art/room-${r.id}.webp`,`art/room-${r.id}.png`];
  img.style.display='block';
  img.onerror=()=>{
    const nxt=trySrc.shift();
    if(nxt) img.src=nxt;
    else{
      img.style.display='none';
      const pal={1:["#0d3311","#7fd18b"],2:["#1a1a2e","#8b8bd1"],4:["#331a0d","#d1a67f"],5:["#330d1f","#d17fa6"],6:["#222","#aaa"],7:["#101","#5ff"],8:["#000","#333"]};
      const c=(pal[r.type]||pal[1]);
      s.style.background=`radial-gradient(circle at 50% 30%, ${c[1]}, ${c[0]} 70%)`;
    }
  };
  s.style.background='#000';
  img.src=trySrc.shift();
  document.getElementById('sceneLabel').textContent=`ROOM ${r.id} · TYPE ${r.type} · ${r.desc.slice(0,60)}…`;
}
function showRoom(){
  const r=room(P); paintScene();
  print(r.desc);
  print("OBVIOUS EXITS: "+exitsStr(r));
  objsHere().forEach(o=>print("THERE IS A "+o.name));
}
function findObj(name){
  name=name.toLowerCase().trim(); if(!name) return null;
  const pool=DB.objects.filter(o=>loc[o.id]===P||loc[o.id]===-2);
  return pool.find(o=>o.name.toLowerCase().includes(name))||null;
}
function cmd(raw){
  TU++; const s=raw.toLowerCase().trim().replace(/\s+/g,' ');
  if(!s) return;
  print("> "+raw.toUpperCase());
  const dirMap={n:'N',north:'N',s:'S',south:'S',w:'W',west:'W',e:'E',east:'E',u:'U',up:'U',d:'D',down:'D'};
  let m=s.match(/^(go|walk|run|jump|move)?\s*(north|south|east|west|up|down|n|s|e|w|u|d)$/);
  if(m){ move(dirMap[m[2]]); return; }
  if(s==="l"||s==="look"){ showRoom(); return; }
  if(s==="i"||s==="inventory"){
    const c=carried();
    if(!c.length) print("YOU ARE CARRYING NOTHING.");
    else { print("YOU ARE CARRYING:"); c.forEach(o=>print("  "+o.name)); }
    return;
  }
  m=s.match(/^(get|take|grab|steal)\s+(.+)$/);
  if(m){
    const o=findObj(m[2]);
    if(!o) print("NOT HERE.");
    else if(loc[o.id]===-2) print("YOU ARE ALREADY CARRYING IT!");
    else if(!o.takeable) print("SORRY - YOU CAN'T.");
    else if(H>=5) print("YOU ARE CARRYING TOO MUCH. BETTER DROP SOMETHING FIRST.");
    else { loc[o.id]=-2; H++; print("OK."); }
    return;
  }
  m=s.match(/^(drop|release|throw)\s+(.+)$/);
  if(m){
    const o=findObj(m[2]);
    if(!o||loc[o.id]!==-2) print("YOU DON'T HAVE IT.");
    else { loc[o.id]=P; H--; print("OK."); }
    return;
  }
  if(s==="help"){ print("TRY: NORTH/SOUTH/EAST/WEST/UP/DOWN, LOOK, GET <name>, DROP <name>, INVENTORY. Full 89-verb scripts from TRANS.bas:1165/1167 are TODO."); return; }
  if(s==="quit"||s==="end"){ print("Refresh to restart. Save = localStorage (TODO)."); return; }
  print("I'M SORRY - I DON'T UNDERSTAND.");
}
function move(d){
  const r=room(P), n=r.exits[d];
  if(n>0){ P=n; showRoom(); }
  else print("YOU CAN'T GO IN THAT DIRECTION.");
}
async function init(){
  DB=await (await fetch('game.json')).json();
  DB.objects.forEach(o=>loc[o.id]=o.loc);
  H=DB.objects.filter(o=>o.loc===-2).length;
  print("VELCOME TO TRANSYLVANIA! (web port v0.1)");
  showRoom();
  const box=document.getElementById('cmd');
  document.getElementById('go').onclick=()=>{cmd(box.value);box.value="";box.focus();};
  box.onkeydown=e=>{if(e.key==="Enter"){cmd(box.value);box.value="";}};
  const dirs=document.getElementById('dirs');
  ["N","S","W","E","U","D","LOOK","INVENTORY"].forEach(d=>{
    const b=document.createElement('button'); b.textContent=d;
    b.onclick=()=>cmd(d.toLowerCase()); dirs.appendChild(b);
  });
}
init();
// export for node --check / tests
if(typeof module!=="undefined") module.exports={move};
