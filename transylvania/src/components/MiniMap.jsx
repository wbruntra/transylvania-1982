import { MAP_ROOMS, buildMapEdges, REGION_COLORS } from '../ui/map.js';

/**
 * @param {object} props
 * @param {number} props.currentRoom
 * @param {number[]} props.visitedRooms
 * @param {any} props.world
 * @param {() => void} props.onOpenMap
 */
export function MiniMap({ currentRoom, visitedRooms = [], world, onOpenMap }) {
  const visitedSet = new Set(visitedRooms.length ? visitedRooms : [currentRoom]);
  visitedSet.add(currentRoom);

  const totalPlayable = Object.keys(MAP_ROOMS).length;
  const count = Math.min(visitedSet.size, totalPlayable);

  const edges = world ? buildMapEdges(world) : [];
  const currentMeta = MAP_ROOMS[currentRoom];

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpenMap();
    }
  };

  return (
    <div
      id="miniMap"
      class="mini-map-card"
      role="button"
      tabIndex={0}
      title="Click to expand map"
      aria-label="Mini-map: click to expand"
      onClick={onOpenMap}
      onKeyDown={handleKeyDown}
    >
      <div class="mini-map-header">
        <span class="mini-map-title">🗺️ MAP</span>
        <span class="mini-map-badge" id="miniMapBadge">
          {count}/{totalPlayable}
        </span>
        <span class="mini-map-expand-icon" aria-hidden="true">
          ⤢
        </span>
      </div>

      <div class="mini-map-viewport" id="miniMapViewport">
        <svg
          id="miniSvg"
          viewBox="0 0 980 700"
          preserveAspectRatio="xMidYMid meet"
          class="mini-map-svg"
        >
          <rect width="100%" height="100%" fill="#04060c" />

          {/* Edges */}
          <g id="miniEdgesLayer">
            {edges.map((edge, i) => {
              const fromId = edge.forward ? edge.a : edge.b;
              const toId = edge.forward ? edge.b : edge.a;
              const from = MAP_ROOMS[fromId];
              const to = MAP_ROOMS[toId];
              if (!from || !to) return null;
              if (!visitedSet.has(fromId) || !visitedSet.has(toId)) return null;

              return (
                <line
                  key={`mini-edge-${i}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="#475569"
                  strokeWidth="3.5"
                  strokeDasharray={
                    edge.kind === 'secret'
                      ? '4,4'
                      : edge.kind === 'stairs'
                        ? '2,3'
                        : undefined
                  }
                />
              );
            })}
          </g>

          {/* Visited Room Dots */}
          <g id="miniRoomsLayer">
            {Object.entries(MAP_ROOMS).map(([idStr, room]) => {
              const id = Number(idStr);
              if (!visitedSet.has(id)) return null;
              const isCurrent = id === currentRoom;
              const color = REGION_COLORS[room.region] || REGION_COLORS.forest;

              return (
                <g key={`mini-room-${id}`} transform={`translate(${room.x}, ${room.y})`}>
                  <circle
                    cx="0"
                    cy="0"
                    r={isCurrent ? '12' : '9'}
                    fill={isCurrent ? '#38bdf8' : color.border}
                    stroke="#fff"
                    strokeWidth={isCurrent ? '2' : '0'}
                  />
                </g>
              );
            })}
          </g>

          {/* Current Player Pulsing Beacon */}
          {currentMeta && (
            <g id="miniPlayerLayer">
              <circle
                cx={currentMeta.x}
                cy={currentMeta.y}
                r="24"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                class="map-player-pulse"
              />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
