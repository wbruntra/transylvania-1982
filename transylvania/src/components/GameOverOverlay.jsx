import { useRef, useEffect } from 'preact/hooks';

/**
 * @param {object} props
 * @param {import('../engine/gameOver.js').GameOverInfo | null} props.info
 * @param {() => void} props.onRestart
 */
export function GameOverOverlay({ info, onRestart }) {
  const restartBtnRef = useRef(null);

  useEffect(() => {
    if (info && restartBtnRef.current) {
      restartBtnRef.current.focus();
    }
  }, [info]);

  if (!info) return null;

  return (
    <div
      id="gameOverOverlay"
      class={`game-over-overlay mode-${info.type}`}
      aria-modal="true"
      role="dialog"
      aria-label="Game Over"
      onClick={onRestart}
    >
      <div class="game-over-backdrop" />
      <div
        class="game-over-card"
        id="gameOverCard"
        onClick={(e) => {
          e.stopPropagation();
          onRestart();
        }}
      >
        <div class="game-over-badge" id="gameOverBadge">
          <span class="badge-icon" id="gameOverBadgeIcon">{info.icon}</span>
          <span id="gameOverBadgeText">{info.badge}</span>
        </div>
        <h2 class="game-over-title" id="gameOverTitle">{info.title}</h2>
        <div class="game-over-desc" id="gameOverDesc">{info.description}</div>
        <div class="game-over-actions">
          <button
            ref={restartBtnRef}
            id="gameOverRestartBtn"
            class="game-over-restart-btn"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRestart();
            }}
          >
            <span class="btn-icon">🔄</span>
            <span id="gameOverRestartText">{info.buttonLabel || 'PLAY AGAIN'}</span>
          </button>
        </div>
        <div class="game-over-hint">
          <span class="key-hint-badge">KEY</span> Press any key or tap button to restart
        </div>
      </div>
    </div>
  );
}
