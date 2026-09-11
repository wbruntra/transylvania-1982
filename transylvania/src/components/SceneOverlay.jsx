import { useRef, useEffect } from 'preact/hooks';
import { updateSceneOverlay } from '../ui/sceneOverlay.js';

/**
 * @param {object} props
 * @param {number} props.roomId
 * @param {import('../engine/state.js').GameState} props.state
 * @param {any} props.world
 * @param {(cmd: string) => void} props.onAction
 * @param {boolean} [props.visible]
 */
export function SceneOverlay({ roomId, state, world, onAction, visible = true }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current) return;
    if (!visible) {
      svgRef.current.innerHTML = '';
      return;
    }
    updateSceneOverlay(svgRef.current, { roomId, state, world, onAction });
  }, [roomId, state, world, onAction, visible]);

  return (
    <svg
      id="sceneOverlay"
      ref={svgRef}
      class="scene-overlay"
      viewBox="0 0 1024 1024"
      style={{ opacity: visible ? 1 : 0 }}
    />
  );
}
