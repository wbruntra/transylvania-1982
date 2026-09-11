import { SceneOverlay } from './SceneOverlay.jsx';
import { GameOverOverlay } from './GameOverOverlay.jsx';

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
 * @param {string} [props.flashClass]
 */
export function Scene({
  room,
  state,
  world,
  artUrl,
  artLoaded,
  onAction,
  gameOverInfo,
  onRestart,
  flashClass = '',
}) {
  const roomId = room?.id ?? 1;
  const labelText = room?.desc ? room.desc.split('\n')[0].replace(/\s+/g, ' ').trim() : '';

  return (
    <div id="scene" class={flashClass}>
      {artUrl && (
        <img
          class="scene-art"
          src={artUrl}
          alt=""
          style={{ opacity: artLoaded ? 1 : 0 }}
        />
      )}

      <SceneOverlay
        roomId={roomId}
        state={state}
        world={world}
        onAction={onAction}
        visible={artLoaded}
      />

      <div
        class="label"
        id="sceneLabel"
        style={{ opacity: artLoaded ? 1 : 0 }}
      >
        {labelText}
      </div>

      <GameOverOverlay info={gameOverInfo} onRestart={onRestart} />
    </div>
  );
}
