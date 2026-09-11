/**
 * @param {object} props
 * @param {number} props.turns
 * @param {'enhanced' | 'classic'} props.artMode
 * @param {() => void} props.onToggleArt
 * @param {() => void} props.onToggleMap
 * @param {() => void} props.onSave
 * @param {() => void} props.onLoad
 * @param {boolean} props.debugActive
 * @param {() => void} props.onToggleDebug
 */
export function ConsoleHeader({
  turns,
  artMode,
  onToggleArt,
  onToggleMap,
  onSave,
  onLoad,
  debugActive,
  onToggleDebug,
}) {
  const isClassic = artMode === 'classic';

  return (
    <header class="console-header">
      <div class="title-group">
        <h1 class="game-title">TRANSYLVANIA</h1>
        <span class="game-subtitle">1982</span>
      </div>
      <div class="header-actions">
        <span class="turn-badge" id="turnBadge">
          TURN {turns}
        </span>

        <button
          id="artToggle"
          class={`icon-button ${isClassic ? 'active' : ''}`}
          type="button"
          onClick={onToggleArt}
          title={isClassic ? 'Switch to illustrated graphics' : 'Switch to 1982 Apple II graphics'}
          aria-label="Toggle 1982 Apple II Graphics"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="14" rx="1" />
            <path d="M3 15l5-5 4 4 5-5 4 4" />
          </svg>
          <span id="artToggleLabel">{isClassic ? '1982' : 'CLASSIC'}</span>
        </button>

        <button
          id="mapToggle"
          class="icon-button"
          type="button"
          onClick={onToggleMap}
          title="View Map Drawer"
          aria-label="View Map Drawer"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
            <line x1="9" y1="3" x2="9" y2="18" />
            <line x1="15" y1="6" x2="15" y2="21" />
          </svg>
          <span>MAP</span>
        </button>

        <button
          id="saveButton"
          class="icon-button"
          type="button"
          onClick={onSave}
          title="Save your progress"
          aria-label="Save game"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
            <path d="M17 21v-8H7v8" />
            <path d="M7 3v5h8" />
          </svg>
          <span>SAVE</span>
        </button>

        <button
          id="loadButton"
          class="icon-button"
          type="button"
          onClick={onLoad}
          title="Load your last saved progress"
          aria-label="Load game"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12a9 9 0 1 0 3-6.7" />
            <path d="M3 3v5h5" />
          </svg>
          <span>LOAD</span>
        </button>

        <button
          id="debugToggle"
          class={`icon-button ${debugActive ? 'active' : ''}`}
          type="button"
          onClick={onToggleDebug}
          title="Toggle debug tester starting inventory (pistol, bullet, cross, elixir, box) -- reloads the game"
          aria-label="Toggle debug tester mode"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4Z" />
            <path d="M6 10h12M4 14h16M8 21l-1-7M16 21l1-7" />
          </svg>
          <span>DEBUG</span>
        </button>
      </div>
    </header>
  );
}
