import { useState, useEffect } from 'preact/hooks';
import { MAP_ROOMS, buildMapEdges, edgeLabel, REGION_COLORS } from '../ui/map.js';
import { objectsInRoom } from '../engine/world.js';
import { getObjectName } from '../engine/state.js';

/**
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {boolean} props.isMaximized
 * @param {() => void} props.onToggleMaximize
 * @param {() => void} props.onClose
 * @param {number} props.currentRoom
 * @param {number[]} props.visitedRooms
 * @param {any} props.world
 * @param {import('../engine/state.js').GameState} props.state
 */
export function MapDrawer({
  isOpen,
  isMaximized,
  onToggleMaximize,
  onClose,
  currentRoom,
  visitedRooms = [],
  world,
  state,
}) {
  const [selectedRoomId, setSelectedRoomId] = useState(currentRoom);

  useEffect(() => {
    setSelectedRoomId(currentRoom);
  }, [currentRoom]);

  const visitedSet = new Set(visitedRooms.length ? visitedRooms : [currentRoom]);
  visitedSet.add(currentRoom);

  const totalPlayable = Object.keys(MAP_ROOMS).length;
  const count = Math.min(visitedSet.size, totalPlayable);

  const edges = world ? buildMapEdges(world) : [];
  const currentMeta = MAP_ROOMS[currentRoom];
  const selectedMeta = MAP_ROOMS[selectedRoomId] || currentMeta;

  // Selected room details
  let selectedDesc = '';
  let selectedExitsText = '';
  let selectedItemsText = '';

  if (world?.rooms?.has(selectedRoomId)) {
    const room = world.room(selectedRoomId);
    selectedDesc = room.desc.replace(/\s+/g, ' ').trim();

    const knownExits = Object.entries(room.exits)
      .filter(([, dest]) => dest > 0)
      .map(([dir, dest]) => {
        const destMeta = MAP_ROOMS[dest];
        return `${dir} → ${destMeta ? destMeta.name : `Room ${dest}`}`;
      });
    selectedExitsText = knownExits.length ? knownExits.join(' · ') : 'Special / None';

    if (state) {
      const hereObjects = objectsInRoom(world, state, selectedRoomId).map((obj) =>
        getObjectName(world, state, obj.id).replace(/\s+/g, ' ').trim()
      );
      selectedItemsText = hereObjects.join(', ');
    }
  }

  return (
    <div
      id="mapDrawer"
      class={`map-drawer ${isOpen ? 'open' : ''}`}
      hidden={!isOpen}
      aria-hidden={!isOpen}
      role="dialog"
      aria-modal="true"
      aria-label="Exploration Map"
    >
      <div class="map-drawer-backdrop" id="mapDrawerBackdrop" onClick={onClose} />

      <div class={`map-drawer-panel ${isMaximized ? 'maximized' : ''}`}>
        {/* Header */}
        <div class="map-drawer-header">
          <div class="drawer-title-wrap">
            <span class="drawer-crest">🗺️</span>
            <div>
              <h2 class="drawer-title">CARTE DE TRANSYLVANIA</h2>
              <div class="drawer-subtitle">EXPLORER'S JOURNAL RECORD</div>
            </div>
          </div>

          <div class="drawer-header-actions">
            <span class="drawer-badge" id="mapDrawerStats">
              {count} / {totalPlayable} CHARTED
            </span>

            <button
              id="mapDrawerExpand"
              class={`drawer-action-btn ${isMaximized ? 'active' : ''}`}
              type="button"
              onClick={onToggleMaximize}
              aria-label="Toggle Fullscreen Map"
              title="Toggle Fullscreen Map"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              </svg>
              <span id="mapDrawerExpandText">{isMaximized ? 'RESTORE' : 'MAXIMIZE'}</span>
            </button>

            <button
              id="mapDrawerClose"
              class="drawer-close-btn"
              type="button"
              onClick={onClose}
              aria-label="Close Map"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              <span>CLOSE</span>
            </button>
          </div>
        </div>

        {/* Map Body SVG */}
        <div id="mapDrawerBody" class="map-drawer-body">
          <div class="drawer-svg-wrap">
            <svg
              id="drawerMapSvg"
              viewBox="0 0 980 700"
              preserveAspectRatio="xMidYMid meet"
              class="trans-map-svg"
            >
              <defs>
                <filter id="drawerGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <marker
                  id="mapArrow"
                  viewBox="0 0 10 10"
                  refX="16"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
                </marker>
                <pattern id="drawerGridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />
                </pattern>
              </defs>

              <rect width="100%" height="100%" fill="#050811" />
              <rect width="100%" height="100%" fill="url(#drawerGridPattern)" />

              {/* Regional Watermarks */}
              <text x="180" y="80" class="map-region-label">THE GREAT FOREST</text>
              <text x="750" y="100" class="map-region-label">CASTLE & CITADEL</text>
              <text x="60" y="580" class="map-region-label">LAKE SHORE</text>
              <text x="440" y="690" class="map-region-label">SUBTERRANEAN CAVES</text>

              {/* Edges Layer */}
              <g id="drawerEdgesLayer">
                {edges.map((edge, i) => {
                  const fromId = edge.forward ? edge.a : edge.b;
                  const toId = edge.forward ? edge.b : edge.a;
                  const from = MAP_ROOMS[fromId];
                  const to = MAP_ROOMS[toId];
                  if (!from || !to) return null;

                  const fromVisited = visitedSet.has(fromId);
                  const toVisited = visitedSet.has(toId);

                  if (fromVisited && toVisited) {
                    let edgeClass = 'map-edge';
                    if (edge.kind === 'secret') edgeClass += ' map-edge-secret';
                    else if (edge.kind === 'stairs') edgeClass += ' map-edge-stairs';
                    else edgeClass += ' map-edge-known';

                    if (edge.twisted) edgeClass += ' map-edge-twisted';
                    else if (edge.oneWay) edgeClass += ' map-edge-oneway';

                    return (
                      <g key={`edge-${i}`}>
                        <line
                          x1={from.x}
                          y1={from.y}
                          x2={to.x}
                          y2={to.y}
                          class={edgeClass}
                          strokeDasharray={
                            edge.kind === 'secret'
                              ? '4,4'
                              : edge.kind === 'stairs'
                                ? '2,3'
                                : undefined
                          }
                          markerEnd={edge.oneWay ? 'url(#mapArrow)' : undefined}
                        />
                        {(edge.oneWay || edge.twisted) && (
                          <text
                            x={(from.x + to.x) / 2}
                            y={(from.y + to.y) / 2 - 6}
                            class="map-edge-label"
                            textAnchor="middle"
                          >
                            {edgeLabel(edge)}
                          </text>
                        )}
                      </g>
                    );
                  }

                  if (fromVisited || toVisited) {
                    const base = fromVisited ? from : to;
                    const target = fromVisited ? to : from;
                    const dx = target.x - base.x;
                    const dy = target.y - base.y;
                    const len = Math.hypot(dx, dy) || 1;
                    const stubLen = Math.min(len * 0.45, 28);
                    const stubX = base.x + (dx / len) * stubLen;
                    const stubY = base.y + (dy / len) * stubLen;

                    return (
                      <line
                        key={`stub-${i}`}
                        x1={base.x}
                        y1={base.y}
                        x2={stubX}
                        y2={stubY}
                        class="map-edge map-edge-stub"
                        strokeDasharray="3,3"
                      />
                    );
                  }

                  return null;
                })}
              </g>

              {/* Rooms Layer */}
              <g id="drawerRoomsLayer">
                {Object.entries(MAP_ROOMS).map(([idStr, room]) => {
                  const id = Number(idStr);
                  const isVisited = visitedSet.has(id);
                  const isCurrent = id === currentRoom;
                  const isSelected = id === selectedRoomId;
                  const color = REGION_COLORS[room.region] || REGION_COLORS.forest;

                  if (isVisited) {
                    return (
                      <g
                        key={`room-${id}`}
                        class={`map-room discovered ${isCurrent ? 'current' : ''} ${isSelected ? 'selected' : ''}`}
                        transform={`translate(${room.x}, ${room.y})`}
                        tabIndex={0}
                        role="button"
                        aria-label={`Room ${id}: ${room.name}`}
                        onClick={() => setSelectedRoomId(id)}
                        onMouseEnter={() => setSelectedRoomId(id)}
                      >
                        <rect
                          x="-44"
                          y="-20"
                          width="88"
                          height="40"
                          rx="8"
                          fill={isCurrent ? '#0f172a' : color.bg}
                          stroke={isCurrent ? '#38bdf8' : isSelected ? '#f8fafc' : color.border}
                          strokeWidth={isCurrent || isSelected ? '2.5' : '1.5'}
                          filter={isCurrent ? 'url(#drawerGlow)' : undefined}
                        />
                        <text x="-29" y="6" class="map-room-icon">
                          {room.icon}
                        </text>
                        <text x="-8" y="-3" class="map-room-title">
                          {room.name.length > 12 ? room.name.slice(0, 11) + '…' : room.name}
                        </text>
                        <text x="-8" y="10" class="map-room-sub">
                          RM {room.id}
                        </text>
                      </g>
                    );
                  }

                  // Fog node
                  return (
                    <g
                      key={`room-fog-${id}`}
                      class="map-room uncharted"
                      transform={`translate(${room.x}, ${room.y})`}
                    >
                      <circle cx="0" cy="0" r="5" class="map-fog-node" />
                    </g>
                  );
                })}
              </g>

              {/* Current Player Marker Layer */}
              {currentMeta && (
                <g id="drawerPlayerLayer">
                  <g transform={`translate(${currentMeta.x}, ${currentMeta.y})`}>
                    <circle cx="0" cy="0" r="34" class="map-player-pulse" />
                    <g transform="translate(0, -30)" class="map-player-pin">
                      <rect
                        x="-38"
                        y="-11"
                        width="76"
                        height="18"
                        rx="4"
                        fill="#0284c7"
                        stroke="#e0f2fe"
                        strokeWidth="1"
                      />
                      <text x="0" y="2" textAnchor="middle" class="map-pin-text">
                        YOU ARE HERE
                      </text>
                    </g>
                  </g>
                </g>
              )}
            </svg>
          </div>
        </div>

        {/* Room Detail Card */}
        <div class="map-detail-card" id="mapDetailCard">
          <div class="detail-header">
            <div class="detail-title-wrap">
              <span class="detail-badge" id="detailBadge">
                ROOM {selectedRoomId}
              </span>
              <strong class="detail-name" id="detailName">
                {selectedMeta?.name || `Room ${selectedRoomId}`}
              </strong>
            </div>
            <span class="detail-region" id="detailRegion">
              {(selectedMeta?.region || 'FOREST').toUpperCase()}
            </span>
          </div>

          <p class="detail-desc" id="detailDesc">
            {selectedDesc || 'Select a charted area to inspect details.'}
          </p>

          <div class="detail-meta">
            <div class="detail-exits" id="detailExits">
              <strong>EXITS:</strong> {selectedExitsText || 'None'}
            </div>
            {selectedItemsText && (
              <div class="detail-items" id="detailItems">
                <strong>ITEMS HERE:</strong> {selectedItemsText}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
