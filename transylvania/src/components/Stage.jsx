import { Scene } from './Scene.jsx';
import { MiniMap } from './MiniMap.jsx';

/**
 * @param {object} props
 * @param {import('../data/gameData.js').RawRoom} props.room
 * @param {import('../engine/state.js').GameState} props.state
 * @param {any} props.world
 * @param {string} props.artUrl
 * @param {boolean} props.artLoaded
 * @param {(cmd: string) => void} props.onAction
 * @param {import('../engine/gameOver.js').GameOverInfo | null} props.gameOverInfo
 * @param {() => void} props.onRestart
 * @param {() => void} props.onOpenMap
 * @param {number[]} props.visitedRooms
 * @param {boolean} props.isMobile
 * @param {import('preact').ComponentChildren} [props.commandRow]
 * @param {string} [props.joltClass]
 * @param {string} [props.flashClass]
 */
export function Stage({
  room,
  state,
  world,
  artUrl,
  artLoaded,
  onAction,
  gameOverInfo,
  onRestart,
  onOpenMap,
  visitedRooms,
  isMobile,
  commandRow,
  joltClass = '',
  flashClass = '',
}) {
  return (
    <main id="stage" class={joltClass} aria-label="Scene Viewport">
      <div
        id="sceneBackdrop"
        style={{
          backgroundImage: artLoaded && artUrl ? `url(${artUrl})` : 'none',
          opacity: artLoaded && artUrl ? 1 : 0,
        }}
      />

      <div class="stage-frame">
        <Scene
          room={room}
          state={state}
          world={world}
          artUrl={artUrl}
          artLoaded={artLoaded}
          onAction={onAction}
          gameOverInfo={gameOverInfo}
          onRestart={onRestart}
          flashClass={flashClass}
        />

        {commandRow}
      </div>

      {!isMobile && (
        <MiniMap
          currentRoom={room?.id ?? 1}
          visitedRooms={visitedRooms}
          world={world}
          onOpenMap={onOpenMap}
        />
      )}
    </main>
  );
}
