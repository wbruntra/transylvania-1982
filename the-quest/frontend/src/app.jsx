import { useEffect, useRef, useState } from 'preact/hooks'
import './app.css'
import { describeRoom, runTurn } from './engine/engine.js'
import { newGame } from './engine/state.js'
import { getRoom } from './engine/world.js'

// Long-form scene-setting prose (the opening cutscene runs well past this)
// gets a dismissible full-screen overlay instead of clogging the compact
// transcript. Most room text is well under this.
const OVERLAY_THRESHOLD = 320

const TIPS = 'Type commands below, or use the buttons. Try LOOK, TAKE <thing>, INVENTORY, or a direction.'

function pictureUrl(picture) {
  return picture ? `/art/p${picture}.png` : null
}

// Extracted room/event text uses a plain CR (\r) as a paragraph break within
// one "message" -- see RESEARCH.md's "Text" section. Split it back into
// separate paragraphs for display rather than running it all together.
function paragraphs(text) {
  return text.split('\r').map((s) => s.trim()).filter(Boolean)
}

/** Turns an engine result into a uniform { picture?, lines, overlay? } shape. */
function normalize(result) {
  if (result.description === undefined) {
    return { lines: result.lines }
  }
  if (result.description.length > OVERLAY_THRESHOLD) {
    return {
      picture: result.picture,
      lines: result.extra,
      overlay: { picture: result.picture, paragraphs: paragraphs(result.description) },
    }
  }
  return { picture: result.picture, lines: [...paragraphs(result.description), ...result.extra] }
}

export function App() {
  const [state, setState] = useState(() => newGame())
  const [entries, setEntries] = useState([])
  const [overlay, setOverlay] = useState(null)
  const [input, setInput] = useState('')
  const [showAbout, setShowAbout] = useState(false)
  const logRef = useRef(null)
  const shownRoomRef = useRef(null)

  // Seed the opening scene once on mount, same path as any other room view.
  useEffect(() => {
    const initial = newGame()
    const view = normalize(describeRoom(initial))
    shownRoomRef.current = initial.room
    setEntries([{ cmd: null, lines: [TIPS, ...view.lines] }])
    if (view.overlay) setOverlay(view.overlay)
  }, [])

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [entries])

  function submit(raw) {
    const command = raw.trim()
    if (!command) return
    const result = runTurn(state, command)
    const view = normalize(result)
    setState({ ...result.state })

    const roomChanged = result.state.room !== shownRoomRef.current
    shownRoomRef.current = result.state.room
    const entry = { cmd: command, lines: view.lines, picture: view.picture }
    setEntries((prev) => (roomChanged ? [entry] : [...prev, entry]))
    setOverlay(view.overlay || null)
    setInput('')
  }

  function onFormSubmit(e) {
    e.preventDefault()
    submit(input)
  }

  const room = getRoom(state.room)
  const exits = room.exits || {}
  const currentPicture = room.picture

  return (
    <div class="game">
      <div class="titlebar">
        <h1>The Quest</h1>
        <span class="meta">Room {state.room} &middot; Turn {state.turns}</span>
      </div>

      <div class="stage">
        {currentPicture ? (
          <img src={pictureUrl(currentPicture)} alt={`Room ${state.room}`} />
        ) : (
          <div class="no-art">(no illustration for this room)</div>
        )}
      </div>

      <div class="log" ref={logRef}>
        {entries.map((entry, i) => (
          <div class="entry" key={i}>
            {entry.cmd && <div class="cmd">{entry.cmd}</div>}
            <div class="lines">
              {entry.lines.map((line, j) => (
                <p key={j}>{line}</p>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div class="controls">
        <div class="dpad">
          {['north', 'south', 'east', 'west', 'up', 'down'].map((dir) => (
            <button key={dir} disabled={!exits[dir]} onClick={() => submit(dir)}>
              {dir.slice(0, 1).toUpperCase() + dir.slice(1)}
            </button>
          ))}
        </div>
        <div class="quickbar">
          <button onClick={() => submit('look')}>Look</button>
          <button onClick={() => submit('inventory')}>Inventory</button>
          <button onClick={() => submit('save')}>Save</button>
          <button onClick={() => submit('restore')}>Restore</button>
          <button onClick={() => setShowAbout((v) => !v)}>About this build</button>
        </div>
        <form class="inputRow" onSubmit={onFormSubmit}>
          <input
            value={input}
            onInput={(e) => setInput(e.currentTarget.value)}
            placeholder="What do you do?"
            autofocus
            autocomplete="off"
          />
          <button type="submit">Go</button>
        </form>
      </div>

      {showAbout && (
        <div class="aboutPanel">
          <p>
            This is an early web port of <em>The Quest</em> (Penguin Software, 1983),
            reverse-engineered from the original Apple II disk images. Movement across
            all 255 rooms, room art, room descriptions, taking/dropping items, reading,
            inventory, and save/restore are implemented from the original game data.
          </p>
          <p>
            The puzzle-specific logic for verbs like OPEN, GIVE, ATTACK, LIGHT, TALK,
            SWIM, KNOCK, TIE, and RIDE hasn't been ported yet -- those commands are
            recognized but currently just shrug. See{' '}
            <code>the-quest/RESEARCH.md</code> in the repository for the full
            reverse-engineering writeup.
          </p>
        </div>
      )}

      {overlay && (
        <div class="storyOverlay" onClick={() => setOverlay(null)}>
          <div class="storyCard" onClick={(e) => e.stopPropagation()}>
            {overlay.picture && (
              <div class="storyArt">
                <img src={pictureUrl(overlay.picture)} alt="" />
              </div>
            )}
            <div class="storyText">
              {overlay.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <button class="storyContinue" onClick={() => setOverlay(null)}>
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
