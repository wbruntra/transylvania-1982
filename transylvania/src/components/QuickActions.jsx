/**
 * @param {object} props
 * @param {(cmd: string) => void} props.onCommand
 * @param {() => void} [props.onOpenMap]
 */
export function QuickActions({ onCommand, onOpenMap }) {
  return (
    <div class="quick-actions" role="toolbar" aria-label="Quick Actions">
      <button
        type="button"
        class="quick-btn"
        onClick={() => onCommand('inventory')}
        title="View Carried Items"
      >
        <span class="quick-icon">🎒</span>
        <span class="quick-text">ITEMS</span>
      </button>

      <button
        type="button"
        class="quick-btn"
        onClick={() => {
          if (onOpenMap) onOpenMap();
          else onCommand('map');
        }}
        title="View Map Drawer"
      >
        <span class="quick-icon">🗺️</span>
        <span class="quick-text">MAP</span>
      </button>

      <button
        type="button"
        class="quick-btn"
        onClick={() => onCommand('wait')}
        title="Pass a turn"
      >
        <span class="quick-icon">⏳</span>
        <span class="quick-text">WAIT</span>
      </button>

      <button
        type="button"
        class="quick-btn"
        onClick={() => onCommand('help')}
        title="Get Advice"
      >
        <span class="quick-icon">❓</span>
        <span class="quick-text">HELP</span>
      </button>
    </div>
  );
}
