import { useState, useRef, useEffect } from 'preact/hooks';

/**
 * @param {object} props
 * @param {(cmd: string) => void} props.onCommand
 * @param {boolean} [props.disabled]
 * @param {boolean} [props.autoFocus]
 */
export function CommandRow({ onCommand, disabled = false, autoFocus = true }) {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus && !disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus, disabled]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (disabled) return;
    const trimmed = value.trim();
    if (!trimmed) return;
    setValue('');
    onCommand(trimmed);
  };

  return (
    <form id="row" onSubmit={handleSubmit} autoComplete="off">
      <span class="prompt-caret">&gt;</span>
      <input
        ref={inputRef}
        id="cmd"
        type="text"
        value={value}
        onInput={(e) => setValue(e.currentTarget.value)}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        disabled={disabled}
        placeholder="COMMAND : e.g. north, look, get note, help"
      />
      <button id="go" type="submit" disabled={disabled}>
        SEND
      </button>
    </form>
  );
}
