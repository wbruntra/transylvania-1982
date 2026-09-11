/**
 * @param {object} props
 * @param {import('../data/gameData.js').RawRoom} props.room
 * @param {import('../engine/state.js').GameState} props.state
 * @param {(cmd: string) => void} props.onCommand
 */
export function DPad({ room, state, onCommand }) {
  const exits = room?.exits || {};
  const isOver = Boolean(state?.isGameOver);

  const exitMap = {
    n: !isOver && exits.N > 0,
    s: !isOver && exits.S > 0,
    w: !isOver && exits.W > 0,
    e: !isOver && exits.E > 0,
    u: !isOver && exits.U > 0,
    d: !isOver && (exits.D > 0 || (room?.id === 5 && Boolean(state?.flags?.GT))),
  };

  const getDirClass = (dir) => {
    return exitMap[dir] ? 'active-exit' : 'disabled-exit';
  };

  return (
    <div class="dpad" role="group" aria-label="Directional Pad">
      <button
        type="button"
        class={`dpad-btn dpad-u ${getDirClass('u')}`}
        onClick={() => onCommand('u')}
        aria-label="Climb Up"
        aria-disabled={!exitMap.u}
      >
        <span class="dpad-icon">▲</span>
        <span class="dpad-label">UP</span>
      </button>

      <button
        type="button"
        class={`dpad-btn dpad-n ${getDirClass('n')}`}
        onClick={() => onCommand('n')}
        aria-label="Go North"
        aria-disabled={!exitMap.n}
      >
        <span class="dpad-icon">▲</span>
        <span class="dpad-label">N</span>
      </button>

      <button
        type="button"
        class={`dpad-btn dpad-d ${getDirClass('d')}`}
        onClick={() => onCommand('d')}
        aria-label="Climb Down"
        aria-disabled={!exitMap.d}
      >
        <span class="dpad-icon">▼</span>
        <span class="dpad-label">DOWN</span>
      </button>

      <button
        type="button"
        class={`dpad-btn dpad-w ${getDirClass('w')}`}
        onClick={() => onCommand('w')}
        aria-label="Go West"
        aria-disabled={!exitMap.w}
      >
        <span class="dpad-icon">◀</span>
        <span class="dpad-label">W</span>
      </button>

      <button
        type="button"
        class="dpad-btn dpad-look"
        onClick={() => onCommand('look')}
        aria-label="Look Around"
      >
        <span class="dpad-icon">👁️</span>
        <span class="dpad-label">LOOK</span>
      </button>

      <button
        type="button"
        class={`dpad-btn dpad-e ${getDirClass('e')}`}
        onClick={() => onCommand('e')}
        aria-label="Go East"
        aria-disabled={!exitMap.e}
      >
        <span class="dpad-icon">▶</span>
        <span class="dpad-label">E</span>
      </button>

      <button
        type="button"
        class="dpad-btn dpad-inv"
        onClick={() => onCommand('inventory')}
        aria-label="Inventory"
      >
        <span class="dpad-icon">🎒</span>
        <span class="dpad-label">INV</span>
      </button>

      <button
        type="button"
        class={`dpad-btn dpad-s ${getDirClass('s')}`}
        onClick={() => onCommand('s')}
        aria-label="Go South"
        aria-disabled={!exitMap.s}
      >
        <span class="dpad-icon">▼</span>
        <span class="dpad-label">S</span>
      </button>

      <button
        type="button"
        class="dpad-btn dpad-wait"
        onClick={() => onCommand('wait')}
        aria-label="Wait a turn"
      >
        <span class="dpad-icon">⏳</span>
        <span class="dpad-label">WAIT</span>
      </button>
    </div>
  );
}
