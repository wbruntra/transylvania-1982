import { useRef, useEffect } from 'preact/hooks';

/**
 * @param {object} props
 * @param {string} props.content
 * @param {string} [props.flashClass]
 */
export function Log({ content, flashClass = '' }) {
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [content]);

  return (
    <div
      id="log"
      ref={logRef}
      class={flashClass}
      role="log"
      aria-live="polite"
    >
      {content}
    </div>
  );
}
