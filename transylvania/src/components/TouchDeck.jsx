import { DPad } from './DPad.jsx';
import { QuickActions } from './QuickActions.jsx';

/**
 * @param {object} props
 * @param {import('../data/gameData.js').RawRoom} props.room
 * @param {import('../engine/state.js').GameState} props.state
 * @param {(cmd: string) => void} props.onCommand
 * @param {() => void} [props.onOpenMap]
 */
export function TouchDeck({ room, state, onCommand, onOpenMap }) {
  return (
    <div class="touch-deck" id="touchDeck">
      <DPad room={room} state={state} onCommand={onCommand} />
      <QuickActions onCommand={onCommand} onOpenMap={onOpenMap} />
    </div>
  );
}
