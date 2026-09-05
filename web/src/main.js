// Bootstrap: load the data, build the engine, wire it to the page.
// The only file that knows about both halves.

import { fetchGameData } from "./data/gameData.js";
import { createEngine } from "./engine/engine.js";
import { createScene } from "./ui/scene.js";
import { createView } from "./ui/view.js";

async function main() {
  const data = await fetchGameData();
  const engine = createEngine(data);

  const scene = createScene(
    /** @type {HTMLElement} */ (document.getElementById("scene")),
    /** @type {HTMLElement} */ (document.getElementById("sceneLabel")),
  );

  const view = createView({
    onCommand(input) {
      const { echo, messages } = engine.execute(input);
      if (echo === null) return;
      view.echo(echo);
      view.print(messages);
      scene.show(engine.world.room(engine.state.room));
    },
  });

  view.print(engine.start());
  scene.show(engine.world.room(engine.state.room));
  view.focus();
}

main().catch((error) => {
  console.error(error);
  const log = document.getElementById("log");
  if (log) log.textContent += `\nFAILED TO START: ${error.message}\n`;
});
