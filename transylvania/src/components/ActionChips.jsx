import { computeActionChips } from '../ui/view.js';

/**
 * @param {object} props
 * @param {import('../data/gameData.js').RawRoom} props.room
 * @param {import('../engine/state.js').GameState} props.state
 * @param {any} props.world
 * @param {(cmd: string) => void} props.onCommand
 */
export function ActionChips({ room, state, world, onCommand }) {
  const chips = computeActionChips(room, state, world) || [];

  return (
    <div class="action-chips-container" id="actionChipsContainer">
      <div class="action-chips" id="actionChips" role="toolbar" aria-label="Contextual Actions">
        {chips.map((chip, index) => (
          <button
            key={`${chip.cmd}-${index}`}
            type="button"
            class={`action-chip ${chip.danger ? 'danger' : ''}`}
            onClick={() => onCommand(chip.cmd)}
          >
            {chip.icon && <span class="chip-icon">{chip.icon}</span>}
            <span class="chip-label">{chip.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
