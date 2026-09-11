// UI controller for the Game Over / Victory overlay above the scene background.

/**
 * @param {object} options
 * @param {HTMLElement} options.overlayElement
 * @param {() => void} options.onRestart
 */
export function createGameOverOverlay({ overlayElement, onRestart }) {
  let shownTimestamp = 0;

  const badgeIcon = overlayElement.querySelector("#gameOverBadgeIcon");
  const badgeText = overlayElement.querySelector("#gameOverBadgeText");
  const title = overlayElement.querySelector("#gameOverTitle");
  const desc = overlayElement.querySelector("#gameOverDesc");
  const card = overlayElement.querySelector("#gameOverCard");
  const restartBtn = overlayElement.querySelector("#gameOverRestartBtn");
  const restartText = overlayElement.querySelector("#gameOverRestartText");

  function safeRestart() {
    if (Date.now() - shownTimestamp < 400) return;
    onRestart();
  }

  if (restartBtn) {
    restartBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      safeRestart();
    });
  }

  overlayElement.addEventListener("click", () => {
    safeRestart();
  });

  if (card) {
    card.addEventListener("click", (e) => {
      if (e.target instanceof HTMLButtonElement) return;
      safeRestart();
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
      shownTimestamp = Date.now();
      overlayElement.hidden = false;
      overlayElement.classList.remove("mode-victory", "mode-defeat", "mode-quit");
      overlayElement.classList.add(`mode-${info.type}`);

      if (badgeIcon) badgeIcon.textContent = info.icon;
      if (badgeText) badgeText.textContent = info.badge;
      if (title) title.textContent = info.title;
      if (desc) desc.textContent = info.description;
      if (restartText) restartText.textContent = info.buttonLabel;

      setTimeout(() => {
        if (restartBtn && typeof restartBtn.focus === "function") {
          restartBtn.focus();
        }
      }, 50);
    },

    hide() {
      shownTimestamp = 0;
      overlayElement.hidden = true;
    },

    isVisible() {
      return !overlayElement.hidden;
    },
  };
}
