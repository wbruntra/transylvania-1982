import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import './app.css'
import { describeRoom, runTurn } from './engine/engine.js'
import { newGame, getRoomExits } from './engine/state.js'
import { getRoom } from './engine/world.js'
import { getRoomLayout } from './engine/mapLayout.js'


// Long-form scene-setting prose (the opening cutscene runs well past this)
// gets a dismissible full-screen overlay instead of clogging the compact
// transcript. Most room text is well under this.
const OVERLAY_THRESHOLD = 320

const TIPS = 'Type commands below, or use the buttons. Try LOOK, TAKE <thing>, INVENTORY, or a direction.'

const ART_STYLES = {
  classic: { label: 'Classic', dir: '/art', ext: 'png', pixelated: true },
  cartoon: { label: "King's Quest", dir: '/art-cartoon', ext: 'webp', pixelated: false },
}
const ART_STYLE_KEY = 'the-quest-art-style'

function loadArtStyle() {
  try {
    const saved = localStorage.getItem(ART_STYLE_KEY)
    if (saved && ART_STYLES[saved]) return saved
  } catch {}
  return 'classic'
}

function pictureUrl(picture, style) {
  if (!picture) return null
  const { dir, ext } = ART_STYLES[style] || ART_STYLES.classic
  return `${dir}/p${picture}.${ext}`
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

const EXIT_DELTA = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] }

// Lays visited rooms out on a doubled grid (room cells on even coordinates,
// connector cells on the odd coordinates between them) so exits between
// adjacent visited rooms can be drawn as short bars.
function buildMap(visited) {
  const layout = getRoomLayout()
  const cells = visited
    .map((id) => ({ id, pos: layout.get(id) }))
    .filter((c) => c.pos)
  if (!cells.length) return null

  const minX = Math.min(...cells.map((c) => c.pos.x))
  const maxX = Math.max(...cells.map((c) => c.pos.x))
  const minY = Math.min(...cells.map((c) => c.pos.y))
  const maxY = Math.max(...cells.map((c) => c.pos.y))

  const nodes = cells.map((c) => ({
    id: c.id,
    gx: (c.pos.x - minX) * 2,
    gy: (c.pos.y - minY) * 2,
  }))
  const nodeByRoom = new Map(cells.map((c) => [c.id, c.pos]))
  const visitedSet = new Set(visited)

  const connectorKeys = new Set()
  const connectors = []
  for (const c of cells) {
    const room = getRoom(c.id)
    if (!room) continue
    for (const [dir, dest] of Object.entries(room.exits)) {
      const [dx, dy] = EXIT_DELTA[dir] || [0, 0]
      if ((dx === 0 && dy === 0) || !visitedSet.has(dest)) continue
      const destPos = nodeByRoom.get(dest)
      if (destPos.x - c.pos.x !== dx || destPos.y - c.pos.y !== dy) continue
      const gx = (c.pos.x - minX) * 2 + dx
      const gy = (c.pos.y - minY) * 2 + dy
      const key = `${gx},${gy}`
      if (connectorKeys.has(key)) continue
      connectorKeys.add(key)
      connectors.push({ key, gx, gy, horizontal: dx !== 0 })
    }
  }

  return {
    nodes,
    connectors,
    width: (maxX - minX) * 2 + 1,
    height: (maxY - minY) * 2 + 1,
  }
}

function RoomArt({ picture, style, alt }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    setFailed(false)
  }, [picture, style])

  if (!picture) return <div class="no-art">(no illustration for this room)</div>

  const effectiveStyle = failed ? 'classic' : style
  const cfg = ART_STYLES[effectiveStyle] || ART_STYLES.classic
  return (
    <img
      src={pictureUrl(picture, effectiveStyle)}
      alt={alt}
      class={cfg.pixelated ? 'pixelated' : ''}
      onError={() => {
        if (!failed && effectiveStyle !== 'classic') setFailed(true)
      }}
    />
  )
}

export function App() {
  const [state, setState] = useState(() => newGame())
  const [entries, setEntries] = useState([])
  const [overlay, setOverlay] = useState(null)
  const [endGame, setEndGame] = useState(null)
  const [input, setInput] = useState('')
  const [showAbout, setShowAbout] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)
  const [artStyle, setArtStyle] = useState(loadArtStyle)
  const logRef = useRef(null)
  const shownRoomRef = useRef(null)
  const historyRef = useRef([])
  const historyIndexRef = useRef(-1)
  const draftRef = useRef('')
  const currentCellRef = useRef(null)

  // Seed the opening scene once on mount, same path as any other room view.
  useEffect(() => {
    const initial = newGame()
    const view = normalize(describeRoom(initial))
    shownRoomRef.current = initial.room
    console.log(`[room] ${initial.room}`)
    setEntries([{ cmd: null, lines: [TIPS, ...view.lines] }])
    if (view.overlay) setOverlay(view.overlay)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(ART_STYLE_KEY, artStyle)
    } catch {}
  }, [artStyle])

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [entries])

  const map = useMemo(() => buildMap(state.visited), [state.visited])

  useEffect(() => {
    if (mapOpen && currentCellRef.current) {
      currentCellRef.current.scrollIntoView({ block: 'center', inline: 'center' })
    }
  }, [mapOpen])

  function submit(raw) {
    const command = raw.trim()
    if (!command) return
    if (historyRef.current[historyRef.current.length - 1] !== command) {
      historyRef.current.push(command)
    }
    historyIndexRef.current = -1
    draftRef.current = ''
    const result = runTurn(state, command)
    const view = normalize(result)
    setState({ ...result.state })

    const roomChanged = result.state.room !== shownRoomRef.current
    if (roomChanged) console.log(`[room] ${shownRoomRef.current} -> ${result.state.room}`)
    shownRoomRef.current = result.state.room
    const entry = { cmd: command, lines: view.lines, picture: view.picture }
    setEntries((prev) => (roomChanged ? [entry] : [...prev, entry]))
    setOverlay(view.overlay || null)
    setInput('')

    if (result.state.over) {
      setEndGame({ won: result.state.won, lines: view.lines })
    }
  }

  function restart() {
    const initial = newGame()
    const view = normalize(describeRoom(initial))
    shownRoomRef.current = initial.room
    setState(initial)
    setEntries([{ cmd: null, lines: [TIPS, ...view.lines] }])
    setOverlay(view.overlay || null)
    setEndGame(null)
    setInput('')
  }

  function onFormSubmit(e) {
    e.preventDefault()
    submit(input)
  }

  function onInputKeyDown(e) {
    const history = historyRef.current
    if (e.key === 'ArrowUp') {
      if (!history.length) return
      e.preventDefault()
      if (historyIndexRef.current === -1) draftRef.current = input
      const next = Math.min(historyIndexRef.current + 1, history.length - 1)
      historyIndexRef.current = next
      setInput(history[history.length - 1 - next])
    } else if (e.key === 'ArrowDown') {
      if (historyIndexRef.current === -1) return
      e.preventDefault()
      const next = historyIndexRef.current - 1
      historyIndexRef.current = next
      setInput(next === -1 ? draftRef.current : history[history.length - 1 - next])
    }
  }

  const room = getRoom(state.room)
  const exits = getRoomExits(state, state.room) || {}
  const currentPicture = room.picture


  return (
    <div class="game">
      <div class="titlebar">
        <h1>The Quest</h1>
        <div class="titlebarRight">
          <span class="meta">Room {state.room} &middot; Turn {state.turns}</span>
          <div class="artStyleToggle" role="group" aria-label="Art style">
            {Object.entries(ART_STYLES).map(([key, cfg]) => (
              <button
                key={key}
                class={key === artStyle ? 'active' : ''}
                onClick={() => setArtStyle(key)}
              >
                {cfg.label}
              </button>
            ))}
          </div>
          <button
            class="miniMap"
            title="Map"
            aria-label="Toggle map"
            aria-expanded={mapOpen}
            onClick={() => setMapOpen((v) => !v)}
          >
            {map &&
              map.nodes.map((n) => (
                <span
                  key={n.id}
                  class={`miniMapDot${n.id === state.room ? ' here' : ''}`}
                  style={{ left: `${(n.gx / Math.max(map.width - 1, 1)) * 100}%`, top: `${(n.gy / Math.max(map.height - 1, 1)) * 100}%` }}
                />
              ))}
          </button>
        </div>
      </div>

      <div class="stage">
        <RoomArt picture={currentPicture} style={artStyle} alt={`Room ${state.room}`} />
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
            onKeyDown={onInputKeyDown}
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

      {mapOpen && <div class="mapScrim" onClick={() => setMapOpen(false)} />}
      <div class={`mapDrawer${mapOpen ? ' open' : ''}`}>
        <div class="mapDrawerHead">
          <span>Map &middot; {map ? map.nodes.length : 0} room{map && map.nodes.length === 1 ? '' : 's'} explored</span>
          <button onClick={() => setMapOpen(false)} aria-label="Close map">&times;</button>
        </div>
        <div class="mapGrid">
          {map && (
            <div
              class="mapGridInner"
              style={{
                gridTemplateColumns: `repeat(${map.width}, var(--map-cell))`,
                gridTemplateRows: `repeat(${map.height}, var(--map-cell))`,
              }}
            >
              {map.connectors.map((c) => (
                <span
                  key={c.key}
                  class={`mapConnector ${c.horizontal ? 'h' : 'v'}`}
                  style={{ gridColumn: c.gx + 1, gridRow: c.gy + 1 }}
                />
              ))}
              {map.nodes.map((n) => (
                <div
                  key={n.id}
                  ref={n.id === state.room ? currentCellRef : null}
                  class={`mapCell${n.id === state.room ? ' here' : ''}`}
                  style={{ gridColumn: n.gx + 1, gridRow: n.gy + 1 }}
                  title={`Room ${n.id}`}
                >
                  {n.id === state.room ? '@' : ''}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {overlay && (
        <div class="storyOverlay" onClick={() => setOverlay(null)}>
          <div class="storyCard" onClick={(e) => e.stopPropagation()}>
            {overlay.picture && (
              <div class="storyArt">
                <RoomArt picture={overlay.picture} style={artStyle} alt="" />
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

      {endGame && (
        <div class="endOverlay">
          <div class="endCard">
            <h2>{endGame.won ? 'Victory!' : 'The Adventure Ends'}</h2>
            {endGame.lines.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
            <button class="endRestart" onClick={restart}>
              Restart
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
