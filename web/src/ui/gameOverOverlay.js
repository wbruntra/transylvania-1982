// UI controller for the Game Over / Victory overlay above the scene background.

/**
 * @param {object} options
 * @param {HTMLElement} options.overlayElement
 * @param {() => void} options.onRestart
 */
export function createGameOverOverlay({ overlayElement, onRestart }) {
  const badgeIcon = overlayElement.querySelector("#gameOverBadgeIcon");
  const badgeText = overlayElement.querySelector("#gameOverBadgeText");
  const title = overlayElement.querySelector("#gameOverTitle");
  const desc = overlayElement.querySelector("#gameOverDesc");
  const card = overlayElement.querySelector("#gameOverCard");
  const restartBtn = overlayElement.querySelector("#gameOverRestartBtn");
  const restartText = overlayElement.querySelector("#gameOverRestartText");

  if (restartBtn) {
    restartBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      onRestart();
    });
  }

  overlayElement.addEventListener("click", () => {
    onRestart();
  });

  if (card) {
    // Clicking inside the card also allows restarting if user taps it
    card.addEventListener("click", (e) => {
      // Let buttons do their thing, but tapping card body also restarts
      if (e.target instanceof HTMLButtonElement) return;
      onRestart();
    });
  }

  return {
    /**
     * @param {import("../engine/gameOver.js").GameOverInfo | null} info
     */
    show(info) {
      if (!info) {
        this.hide();
        return;
      }
      overlayElement.hidden = false;
      overlayElement.classList.remove("mode-victory", "mode-defeat", "mode-quit");
      overlayElement.classList.add(`mode-${info.type}`);

      if (badgeIcon) badgeIcon.textContent = info.icon;
      if (badgeText) badgeText.textContent = info.badge;
      if (title) title.textContent = info.title;
      if (desc) desc.textContent = info.description;
      if (restartText) restartText.textContent = info.buttonLabel;
    },

    hide() {
      overlayElement.hidden = true;
    },

    isVisible() {
      return !overlayElement.hidden;
    },
  };
}
