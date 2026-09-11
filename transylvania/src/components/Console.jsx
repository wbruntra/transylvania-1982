import { ConsoleHeader } from './ConsoleHeader.jsx';
import { Log } from './Log.jsx';
import { ActionChips } from './ActionChips.jsx';
import { TouchDeck } from './TouchDeck.jsx';

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
 * @param {string} props.logContent
 * @param {string} [props.logFlashClass]
 * @param {import('../data/gameData.js').RawRoom} props.room
 * @param {import('../engine/state.js').GameState} props.state
 * @param {any} props.world
 * @param {(cmd: string) => void} props.onCommand
 * @param {import('preact').ComponentChildren} [props.commandRow]
 */
export function Console({
  turns,
  artMode,
  onToggleArt,
  onToggleMap,
  onSave,
  onLoad,
  debugActive,
  onToggleDebug,
  logContent,
  logFlashClass,
  room,
  state,
  world,
  onCommand,
  commandRow,
}) {
  return (
    <aside id="console" aria-label="Game Console">
      <ConsoleHeader
        turns={turns}
        artMode={artMode}
        onToggleArt={onToggleArt}
        onToggleMap={onToggleMap}
        onSave={onSave}
        onLoad={onLoad}
        debugActive={debugActive}
        onToggleDebug={onToggleDebug}
      />

      <Log content={logContent} flashClass={logFlashClass} />

      <footer class="console-footer">
        <ActionChips
          room={room}
          state={state}
          world={world}
          onCommand={onCommand}
        />

        <TouchDeck
          room={room}
          state={state}
          onCommand={onCommand}
          onOpenMap={onToggleMap}
        />

        {commandRow}

        <div class="meta-hint">
          <small>Data from Apple II · Tap directions or chips · <b>HELP</b> for clues</small>
        </div>
      </footer>
    </aside>
  );
}
