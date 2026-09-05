// The terminal: transcript, prompt, shortcut buttons. It looks its elements up
// once, and it never decides anything about the game -- it prints what the
// engine hands back and reports what the player typed.

const SHORTCUTS = ["N", "S", "W", "E", "U", "D", "LOOK", "INVENTORY"];

/**
 * @param {{onCommand: (input: string) => void}} handlers
 */
export function createView({ onCommand }) {
  const log = /** @type {HTMLElement} */ (document.getElementById("log"));
  const input = /** @type {HTMLInputElement} */ (document.getElementById("cmd"));
  const submit = /** @type {HTMLButtonElement} */ (document.getElementById("go"));
  const shortcuts = /** @type {HTMLElement} */ (document.getElementById("dirs"));

  function submitInput() {
    const value = input.value;
    input.value = "";
    input.focus();
    onCommand(value);
  }

  submit.addEventListener("click", submitInput);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") submitInput();
  });

  for (const shortcut of SHORTCUTS) {
    const button = document.createElement("button");
    button.textContent = shortcut;
    button.addEventListener("click", () => onCommand(shortcut.toLowerCase()));
    shortcuts.append(button);
  }

  return {
    /** @param {string[]} lines */
    print(lines) {
      if (lines.length === 0) return;
      log.textContent += `${lines.join("\n")}\n`;
      log.scrollTop = log.scrollHeight;
    },

    /** @param {string} input */
    echo(input) {
      this.print([`> ${input}`]);
    },

    focus() {
      input.focus();
    },
  };
}
