// Interactive Fog-of-War Cartography System for Transylvania (1982)
// Provides a compact floating mini-map and an expandable slide-in map drawer.

import { objectsInRoom } from "../engine/world.js";
import { getObjectName } from "../engine/state.js";

export const MAP_ROOMS = {
  // South Forest & Lake
  1: { id: 1, name: "Ancient Stump", region: "forest", x: 380, y: 640, icon: "🪵" },
  8: { id: 8, name: "Cave Entrance", region: "caves", x: 380, y: 556, icon: "🪨" },
  3: { id: 3, name: "Dark Forest", region: "forest", x: 250, y: 502, icon: "🌲" },
  16: { id: 16, name: "Lake Shore", region: "lake", x: 120, y: 558, icon: "🌊" },
  15: { id: 15, name: "Willow Tree", region: "lake", x: 120, y: 446, icon: "🌳" },

  // Roads & Dwellings
  19: { id: 19, name: "Dirt Road", region: "dwellings", x: 250, y: 420, icon: "🛤️" },
  20: { id: 20, name: "Grim Shack", region: "dwellings", x: 150, y: 384, icon: "🏚️" },
  21: { id: 21, name: "Log Cabin", region: "dwellings", x: 350, y: 380, icon: "🛖" },
  22: { id: 22, name: "Secret Annex", region: "secret", x: 441, y: 390, icon: "🚪" },

  // Forest Centre & North
  17: { id: 17, name: "Deep Forest", region: "forest", x: 130, y: 290, icon: "🌲" },
  2: { id: 2, name: "Broken Wagon", region: "forest", x: 250, y: 294, icon: "🛒" },
  38: { id: 38, name: "Inside Wagon", region: "secret", x: 250, y: 232, icon: "📦" },
  4: { id: 4, name: "Forest Clearing", region: "forest", x: 130, y: 150, icon: "🌿" },
  5: { id: 5, name: "Cemetery", region: "cemetery", x: 250, y: 170, icon: "🪦" },
  11: { id: 11, name: "Secret Chamber", region: "secret", x: 250, y: 70, icon: "🗝️" },
  14: { id: 14, name: "Dismal Forest", region: "forest", x: 380, y: 115, icon: "🌲" },

  // Old Frame House & East Countryside
  23: { id: 23, name: "Frame House", region: "dwellings", x: 528, y: 109, icon: "🏡" },
  24: { id: 24, name: "Inside House", region: "dwellings", x: 472, y: 45, icon: "🛋️" },
  25: { id: 25, name: "House Attic", region: "dwellings", x: 410, y: 45, icon: "🕯️" },
  12: { id: 12, name: "Crossroad", region: "forest", x: 379, y: 494, icon: "➕" },
  18: { id: 18, name: "Foreboding Forest", region: "forest", x: 500, y: 171, icon: "🌲" },
  6: { id: 6, name: "Clay Hut Path", region: "dwellings", x: 500, y: 233, icon: "🛖" },
  7: { id: 7, name: "Inside Clay Hut", region: "dwellings", x: 580, y: 350, icon: "🏺" },
  26: { id: 26, name: "Sandy Field", region: "forest", x: 600, y: 288, icon: "🌾" },

  // Caves
  9: { id: 9, name: "Dark Cave", region: "caves", x: 490, y: 640, icon: "🦇" },
  10: { id: 10, name: "Crystal Cave", region: "caves", x: 490, y: 530, icon: "🔮" },

  // Castle & Approaches
  13: { id: 13, name: "Castle Approach", region: "castle", x: 520, y: 439, icon: "🏰" },
  27: { id: 27, name: "Castle Entrance", region: "castle", x: 698, y: 384, icon: "🚪" },
  28: { id: 28, name: "West Guardroom", region: "castle", x: 642, y: 540, icon: "🛡️" },
  29: { id: 29, name: "East Parlor", region: "castle", x: 770, y: 540, icon: "🍷" },
  30: { id: 30, name: "Grand Chamber", region: "castle", x: 770, y: 329, icon: "🏛️" },

  // Castle Tower
  36: { id: 36, name: "High Chamber", region: "tower", x: 770, y: 267, icon: "🪜" },
  37: { id: 37, name: "Moonlit Tower", region: "tower", x: 770, y: 200, icon: "👸" },

  // Castle Dungeon & Vault
  31: { id: 31, name: "Castle Cellar", region: "dungeon", x: 880, y: 440, icon: "🗝️" },
  33: { id: 33, name: "Dungeon Cell", region: "dungeon", x: 880, y: 540, icon: "⛓️" },
  34: { id: 34, name: "Musty Dungeon", region: "dungeon", x: 880, y: 320, icon: "💀" },
  35: { id: 35, name: "Royal Treasure", region: "dungeon", x: 880, y: 200, icon: "👑" },

  // Unreachable by ordinary movement
  32: { id: 32, name: "Featureless Void", region: "secret", x: 620, y: 640, icon: "🌀" },
};

/**
 * How a connection is drawn, for the few that are not ordinary paths. Keyed by
 * the room pair, low id first. Everything else is inferred: any link using U or
 * D is stairs, the rest are paths.
 */
const EDGE_KINDS = {
  "1-9": "secret", // KNOCK at the stump teleports you into the cave
  "5-11": "secret", // grate under the gravestone
  "21-22": "secret", // the rotating wall
  "6-7": "door",
  "9-10": "door",
  "19-20": "door",
  "19-21": "door",
  "23-24": "door",
  "27-28": "door",
  "27-29": "door",
  "2-38": "door",
  "13-27": "gate",
  "27-30": "hall",
};

const COMPASS = ["N", "S", "W", "E"];
const OPPOSITE = { N: "S", S: "N", E: "W", W: "E", U: "D", D: "U" };

/**
 * Derives the map's connections from the game data rather than a hand-kept
 * list, so the two cannot drift apart.
 *
 * Each edge records which directions lead each way, because this map is not
 * symmetric: 18 of the original's 66 exits are one-way. Room 3 goes W to room
 * 17, but room 17's E leads to room 2, not back to 3 -- so the player who
 * retraces their steps ends up somewhere new. That is 1982 design, not a bug,
 * and the map should show it rather than imply a tidy round trip.
 *
 * @param {any} world
 * @returns {Array<{a: number, b: number, aToB: string[], bToA: string[],
 *                  oneWay: boolean, forward: boolean, kind: string}>}
 */
export function buildMapEdges(world) {
  /** @type {Map<string, any>} */
  const edges = new Map();

  for (const room of world.rooms.values()) {
    for (const [dir, dest] of Object.entries(room.exits)) {
      if (dest <= 0) continue;
      const a = Math.min(room.id, dest);
      const b = Math.max(room.id, dest);
      const key = `${a}-${b}`;
      let edge = edges.get(key);
      if (!edge) {
        edge = { a, b, aToB: [], bToA: [], oneWay: false, forward: true, kind: "path" };
        edges.set(key, edge);
      }
      (room.id === a ? edge.aToB : edge.bToA).push(dir);
    }
  }

  for (const edge of edges.values()) {
    // No compass exit leads back. These are almost all interiors you leave with
    // the EXIT/OUT verb instead -- TRANS.bas:10010 computes the way out
    // arithmetically from the room type (P = P - RT%(P) + 3) rather than
    // storing it as an exit -- so they are not truly dead ends.
    edge.oneWay = edge.aToB.length === 0 || edge.bToA.length === 0;

    // Connected both ways, but not by opposite directions: go west and you
    // come back south. Five of these sit in the forest and they are the reason
    // retracing your steps can strand you somewhere new.
    edge.twisted =
      !edge.oneWay &&
      !(
        edge.aToB.every((d) => edge.bToA.includes(OPPOSITE[d])) &&
        edge.bToA.every((d) => edge.aToB.includes(OPPOSITE[d]))
      );

    // Which way an arrow should point when the link only works one way.
    edge.forward = edge.aToB.length > 0;
    const vertical = [...edge.aToB, ...edge.bToA].some((d) => d === "U" || d === "D");
    edge.kind = EDGE_KINDS[`${edge.a}-${edge.b}`] ?? (vertical ? "stairs" : "path");
  }

  return [...edges.values()];
}

/**
 * What to write beside a connection that does not behave the way it looks.
 * A twisted link shows both journeys ("W / S back"), because knowing only one
 * half is what strands the player.
 */
export function edgeLabel(edge) {
  const pick = (dirs) => dirs.filter((d) => COMPASS.includes(d)).join("/") || dirs.join("/");
  if (edge.twisted) return `${pick(edge.aToB)} / ${pick(edge.bToA)} back`;
  return pick(edge.forward ? edge.aToB : edge.bToA);
}

export const REGION_COLORS = {
  forest: { bg: "#064e3b", border: "#10b981", text: "#a7f3d0" },
  lake: { bg: "#083344", border: "#06b6d4", text: "#a5f3fc" },
  cemetery: { bg: "#2e1065", border: "#8b5cf6", text: "#ddd6fe" },
  dwellings: { bg: "#451a03", border: "#f59e0b", text: "#fde68a" },
  caves: { bg: "#1e293b", border: "#64748b", text: "#cbd5e1" },
  castle: { bg: "#4c0519", border: "#f43f5e", text: "#fecdd3" },
  tower: { bg: "#3b0764", border: "#c084fc", text: "#f3e8ff" },
  dungeon: { bg: "#450a0a", border: "#ef4444", text: "#fca5a5" },
  secret: { bg: "#500724", border: "#ec4899", text: "#fbcfe8" },
};

/**
 * Initializes the dual mini-map and slide-in map drawer controller.
 * @param {object} elements
 * @param {HTMLElement} elements.miniMapElement
 * @param {HTMLElement} elements.miniMapViewport
 * @param {HTMLElement} elements.miniMapBadge
 * @param {HTMLElement} elements.drawerElement
 * @param {HTMLElement} elements.drawerBody
 * @param {HTMLElement} elements.drawerStats
 * @param {HTMLElement} elements.drawerClose
 * @param {HTMLElement} elements.drawerBackdrop
 */
export function createMap(elements) {
  const {
    miniMapElement,
    miniMapViewport,
    miniMapBadge,
    drawerElement,
    drawerBody,
    drawerStats,
    drawerClose,
    drawerBackdrop,
  } = elements;

  // Build Drawer Map Shell
  drawerBody.innerHTML = `
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
  `;

  // Build Mini-Map Shell
  miniMapViewport.innerHTML = `
    <svg id="miniSvg" viewBox="0 0 980 700" preserveAspectRatio="xMidYMid meet" class="mini-map-svg">
      <rect width="100%" height="100%" fill="#04060c" />
      <g id="miniEdgesLayer"></g>
      <g id="miniRoomsLayer"></g>
      <g id="miniPlayerLayer"></g>
    </svg>
  `;

  const drawerEdges = drawerBody.querySelector("#drawerEdgesLayer");
  const drawerRooms = drawerBody.querySelector("#drawerRoomsLayer");
  const drawerPlayer = drawerBody.querySelector("#drawerPlayerLayer");

  const miniEdges = miniMapViewport.querySelector("#miniEdgesLayer");
  const miniRooms = miniMapViewport.querySelector("#miniRoomsLayer");
  const miniPlayer = miniMapViewport.querySelector("#miniPlayerLayer");

  const detailBadge = document.getElementById("detailBadge");
  const detailName = document.getElementById("detailName");
  const detailRegion = document.getElementById("detailRegion");
  const detailDesc = document.getElementById("detailDesc");
  const detailExits = document.getElementById("detailExits");
  const detailItems = document.getElementById("detailItems");

  let isDrawerOpen = false;

  function openDrawer() {
    isDrawerOpen = true;
    drawerElement.hidden = false;
    drawerElement.setAttribute("aria-hidden", "false");
    void drawerElement.offsetWidth;
    drawerElement.classList.add("open");
    if (drawerClose) drawerClose.focus();
  }

  function closeDrawer() {
    isDrawerOpen = false;
    drawerElement.classList.remove("open");
    drawerElement.setAttribute("aria-hidden", "true");
    setTimeout(() => {
      if (!isDrawerOpen) drawerElement.hidden = true;
    }, 280);
  }

  function toggleDrawer() {
    if (isDrawerOpen) closeDrawer();
    else openDrawer();
  }

  // Event listeners for opening/closing drawer
  if (miniMapElement) {
    miniMapElement.addEventListener("click", openDrawer);
    miniMapElement.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openDrawer();
      }
    });
  }

  if (drawerClose) drawerClose.addEventListener("click", closeDrawer);
  if (drawerBackdrop) drawerBackdrop.addEventListener("click", closeDrawer);

  const drawerExpand = document.getElementById("mapDrawerExpand");
  const drawerExpandText = document.getElementById("mapDrawerExpandText");
  const drawerPanel = drawerElement ? drawerElement.querySelector(".map-drawer-panel") : null;

  if (drawerExpand && drawerPanel) {
    drawerExpand.addEventListener("click", () => {
      const isMax = drawerPanel.classList.toggle("maximized");
      drawerExpand.classList.toggle("active", isMax);
      if (drawerExpandText) drawerExpandText.textContent = isMax ? "RESTORE" : "MAXIMIZE";
    });
  }

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isDrawerOpen) {
      closeDrawer();
    }
  });

  function showRoomDetails(roomId, world, state) {
    const roomMeta = MAP_ROOMS[roomId];
    if (!roomMeta) return;

    if (detailBadge) detailBadge.textContent = `ROOM ${roomId}`;
    if (detailName) detailName.textContent = roomMeta.name;
    if (detailRegion) detailRegion.textContent = roomMeta.region.toUpperCase();

    if (world && world.rooms && world.rooms.has(roomId)) {
      const room = world.room(roomId);
      if (detailDesc) detailDesc.textContent = room.desc.replace(/\s+/g, " ").trim();

      const knownExits = Object.entries(room.exits)
        .filter(([, dest]) => dest > 0)
        .map(([dir, dest]) => {
          const destMeta = MAP_ROOMS[dest];
          return `${dir} → ${destMeta ? destMeta.name : `Room ${dest}`}`;
        });
      if (detailExits) {
        detailExits.innerHTML = `<strong>EXITS:</strong> ${knownExits.length ? knownExits.join(" · ") : "Special / None"}`;
      }

      if (state && detailItems) {
        const hereObjects = objectsInRoom(world, state, roomId).map((object) =>
          getObjectName(world, state, object.id).replace(/\s+/g, " ").trim()
        );
        detailItems.innerHTML = hereObjects.length
          ? `<strong>ITEMS HERE:</strong> ${hereObjects.join(", ")}`
          : "";
      }
    }
  }

  return {
    open: openDrawer,
    close: closeDrawer,
    toggle: toggleDrawer,
    isOpen: () => isDrawerOpen,

    /**
     * Updates both the mini-map and drawer viewports with the latest state.
     * @param {object} params
     * @param {number} params.currentRoom
     * @param {number[]} params.visitedRooms
     * @param {any} params.world
     * @param {any} params.state
     */
    update({ currentRoom, visitedRooms = [], world, state }) {
      const visitedSet = new Set(visitedRooms.length ? visitedRooms : [currentRoom]);
      visitedSet.add(currentRoom);

      const totalPlayable = Object.keys(MAP_ROOMS).length;
      const count = Math.min(visitedSet.size, totalPlayable);

      // Update counters
      if (miniMapBadge) miniMapBadge.textContent = `${count}/${totalPlayable}`;
      if (drawerStats) drawerStats.textContent = `${count} / ${totalPlayable} CHARTED`;

      // 1. Render Edges for both drawer and mini-map
      drawerEdges.innerHTML = "";
      miniEdges.innerHTML = "";

      for (const edge of buildMapEdges(world)) {
        // Draw in the direction of travel so a one-way arrow points the right way.
        const fromId = edge.forward ? edge.a : edge.b;
        const toId = edge.forward ? edge.b : edge.a;
        const type = edge.kind;
        const from = MAP_ROOMS[fromId];
        const to = MAP_ROOMS[toId];
        if (!from || !to) continue;

        const fromVisited = visitedSet.has(fromId);
        const toVisited = visitedSet.has(toId);

        if (fromVisited && toVisited) {
          // Drawer line
          const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
          line.setAttribute("x1", from.x);
          line.setAttribute("y1", from.y);
          line.setAttribute("x2", to.x);
          line.setAttribute("y2", to.y);

          if (type === "secret") {
            line.setAttribute("class", "map-edge map-edge-secret");
            line.setAttribute("stroke-dasharray", "4,4");
          } else if (type === "stairs") {
            line.setAttribute("class", "map-edge map-edge-stairs");
            line.setAttribute("stroke-dasharray", "2,3");
          } else {
            line.setAttribute("class", "map-edge map-edge-known");
          }

          // A one-way link gets an arrowhead and its direction spelled out, so
          // the player can see that walking back will not return them.
          if (edge.oneWay || edge.twisted) {
            line.classList.add(edge.twisted ? "map-edge-twisted" : "map-edge-oneway");
            if (edge.oneWay) line.setAttribute("marker-end", "url(#mapArrow)");

            const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
            label.setAttribute("x", String((from.x + to.x) / 2));
            label.setAttribute("y", String((from.y + to.y) / 2 - 6));
            label.setAttribute("class", "map-edge-label");
            label.setAttribute("text-anchor", "middle");
            label.textContent = edgeLabel(edge);
            drawerEdges.appendChild(label);
          }

          drawerEdges.appendChild(line);

          // Mini line
          const miniLine = line.cloneNode(true);
          miniLine.setAttribute("stroke-width", "3.5");
          miniLine.setAttribute("stroke", "#475569");
          miniEdges.appendChild(miniLine);
        } else if (fromVisited || toVisited) {
          // Stub for drawer
          const base = fromVisited ? from : to;
          const target = fromVisited ? to : from;

          const dx = target.x - base.x;
          const dy = target.y - base.y;
          const len = Math.hypot(dx, dy) || 1;
          const stubLen = Math.min(len * 0.45, 28);
          const stubX = base.x + (dx / len) * stubLen;
          const stubY = base.y + (dy / len) * stubLen;

          const stub = document.createElementNS("http://www.w3.org/2000/svg", "line");
          stub.setAttribute("x1", base.x);
          stub.setAttribute("y1", base.y);
          stub.setAttribute("x2", stubX);
          stub.setAttribute("y2", stubY);
          stub.setAttribute("class", "map-edge map-edge-stub");
          stub.setAttribute("stroke-dasharray", "3,3");
          drawerEdges.appendChild(stub);
        }
      }

      // 2. Render Rooms for drawer and mini-map
      drawerRooms.innerHTML = "";
      miniRooms.innerHTML = "";

      for (const [idStr, room] of Object.entries(MAP_ROOMS)) {
        const id = Number(idStr);
        const isVisited = visitedSet.has(id);
        const isCurrent = id === currentRoom;
        const color = REGION_COLORS[room.region] || REGION_COLORS.forest;

        // Drawer Room Node
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("class", `map-room ${isVisited ? "discovered" : "uncharted"} ${isCurrent ? "current" : ""}`);
        g.setAttribute("transform", `translate(${room.x}, ${room.y})`);

        if (isVisited) {
          g.setAttribute("tabindex", "0");
          g.setAttribute("role", "button");
          g.setAttribute("aria-label", `Room ${id}: ${room.name}`);

          const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
          rect.setAttribute("x", "-44");
          rect.setAttribute("y", "-20");
          rect.setAttribute("width", "88");
          rect.setAttribute("height", "40");
          rect.setAttribute("rx", "8");
          rect.setAttribute("fill", isCurrent ? "#0f172a" : color.bg);
          rect.setAttribute("stroke", isCurrent ? "#38bdf8" : color.border);
          rect.setAttribute("stroke-width", isCurrent ? "2.5" : "1.5");
          if (isCurrent) rect.setAttribute("filter", "url(#drawerGlow)");
          g.appendChild(rect);

          const iconText = document.createElementNS("http://www.w3.org/2000/svg", "text");
          iconText.setAttribute("x", "-29");
          iconText.setAttribute("y", "6");
          iconText.setAttribute("class", "map-room-icon");
          iconText.textContent = room.icon;
          g.appendChild(iconText);

          const nameText = document.createElementNS("http://www.w3.org/2000/svg", "text");
          nameText.setAttribute("x", "-8");
          nameText.setAttribute("y", "-3");
          nameText.setAttribute("class", "map-room-title");
          nameText.textContent = room.name.length > 12 ? room.name.slice(0, 11) + "…" : room.name;
          g.appendChild(nameText);

          const idText = document.createElementNS("http://www.w3.org/2000/svg", "text");
          idText.setAttribute("x", "-8");
          idText.setAttribute("y", "10");
          idText.setAttribute("class", "map-room-sub");
          idText.textContent = `RM ${room.id}`;
          g.appendChild(idText);

          g.addEventListener("click", () => showRoomDetails(id, world, state));
          g.addEventListener("mouseenter", () => showRoomDetails(id, world, state));

          // Mini-Map Node: compact pill
          const miniG = document.createElementNS("http://www.w3.org/2000/svg", "g");
          miniG.setAttribute("transform", `translate(${room.x}, ${room.y})`);
          const miniDot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          miniDot.setAttribute("cx", "0");
          miniDot.setAttribute("cy", "0");
          miniDot.setAttribute("r", isCurrent ? "12" : "9");
          miniDot.setAttribute("fill", isCurrent ? "#38bdf8" : color.border);
          miniDot.setAttribute("stroke", "#fff");
          miniDot.setAttribute("stroke-width", isCurrent ? "2" : "0");
          miniG.appendChild(miniDot);
          miniRooms.appendChild(miniG);
        } else {
          // Unexplored fog node in drawer
          const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          circle.setAttribute("cx", "0");
          circle.setAttribute("cy", "0");
          circle.setAttribute("r", "5");
          circle.setAttribute("class", "map-fog-node");
          g.appendChild(circle);
        }

        drawerRooms.appendChild(g);
      }

      // 3. Render Player Beacons
      drawerPlayer.innerHTML = "";
      miniPlayer.innerHTML = "";

      const currentMeta = MAP_ROOMS[currentRoom];
      if (currentMeta) {
        // Drawer Beacon
        const beaconG = document.createElementNS("http://www.w3.org/2000/svg", "g");
        beaconG.setAttribute("transform", `translate(${currentMeta.x}, ${currentMeta.y})`);

        const pulse = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        pulse.setAttribute("cx", "0");
        pulse.setAttribute("cy", "0");
        pulse.setAttribute("r", "34");
        pulse.setAttribute("class", "map-player-pulse");
        beaconG.appendChild(pulse);

        const pin = document.createElementNS("http://www.w3.org/2000/svg", "g");
        pin.setAttribute("transform", "translate(0, -30)");
        pin.setAttribute("class", "map-player-pin");

        const pinRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        pinRect.setAttribute("x", "-38");
        pinRect.setAttribute("y", "-11");
        pinRect.setAttribute("width", "76");
        pinRect.setAttribute("height", "18");
        pinRect.setAttribute("rx", "4");
        pinRect.setAttribute("fill", "#0284c7");
        pinRect.setAttribute("stroke", "#e0f2fe");
        pinRect.setAttribute("stroke-width", "1");
        pin.appendChild(pinRect);

        const pinText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        pinText.setAttribute("x", "0");
        pinText.setAttribute("y", "2");
        pinText.setAttribute("text-anchor", "middle");
        pinText.setAttribute("class", "map-pin-text");
        pinText.textContent = "YOU ARE HERE";
        pin.appendChild(pinText);

        beaconG.appendChild(pin);
        drawerPlayer.appendChild(beaconG);

        // Mini Beacon: pulsing cyan radar ring
        const miniPulse = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        miniPulse.setAttribute("cx", currentMeta.x);
        miniPulse.setAttribute("cy", currentMeta.y);
        miniPulse.setAttribute("r", "20");
        miniPulse.setAttribute("class", "mini-player-pulse");
        miniPlayer.appendChild(miniPulse);
      }

      showRoomDetails(currentRoom, world, state);
    },
  };
}
