import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import { fetchGameData } from '../data/gameData.js';
import { createEngine } from '../engine/engine.js';
import { getGameOverInfo } from '../engine/gameOver.js';
import { isDebugInventoryEnabled, toggleDebugInventory } from '../ui/debugMode.js';
import { artCandidates, preloadSurroundings, preloadAllRooms } from '../ui/scene.js';
import { connectAgentBridge } from '../ui/agentBridge.js';

const ART_MODE_KEY = 'transylvania-art-mode';

// WebAudio synthesis helpers (matching effects.js)
let audioCtx = null;
function getAudioContext() {
  if (audioCtx === null && typeof window !== 'undefined') {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    audioCtx = Ctor ? new Ctor() : false;
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx || null;
}

function playWhoosh(ctx) {
  const now = ctx.currentTime;
  const duration = 0.9;
  const frames = Math.floor(ctx.sampleRate * duration);
  const noise = ctx.createBuffer(1, frames, ctx.sampleRate);
  const channel = noise.getChannelData(0);
  for (let i = 0; i < frames; i += 1) {
    channel[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  }
  const source = ctx.createBufferSource();
  source.buffer = noise;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 1.2;
  filter.frequency.setValueAtTime(2400, now);
  filter.frequency.exponentialRampToValueAtTime(220, now + duration);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.0001, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.28, now + 0.08);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  source.connect(filter).connect(noiseGain).connect(ctx.destination);
  source.start(now);
  source.stop(now + duration);

  const thud = ctx.createOscillator();
  thud.type = 'sine';
  thud.frequency.setValueAtTime(140, now);
  thud.frequency.exponentialRampToValueAtTime(42, now + 0.35);

  const thudGain = ctx.createGain();
  thudGain.gain.setValueAtTime(0.0001, now);
  thudGain.gain.exponentialRampToValueAtTime(0.45, now + 0.02);
  thudGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

  thud.connect(thudGain).connect(ctx.destination);
  thud.start(now);
  thud.stop(now + 0.5);
}

function playThud(ctx) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(90, now);
  osc.frequency.exponentialRampToValueAtTime(30, now + 0.7);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.4, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.8);
}

export function useGame() {
  const [data, setData] = useState(null);
  const [engine, setEngine] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [logText, setLogText] = useState('');
  const [artMode, setArtMode] = useState(() => {
    try {
      return localStorage.getItem(ART_MODE_KEY) === 'classic' ? 'classic' : 'enhanced';
    } catch {
      return 'enhanced';
    }
  });
  const [artUrl, setArtUrl] = useState('');
  const [artLoaded, setArtLoaded] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isMapMaximized, setIsMapMaximized] = useState(false);
  const [gameOverInfo, setGameOverInfo] = useState(null);
  const [joltClass, setJoltClass] = useState('');
  const [flashClass, setFlashClass] = useState('');

  const gameOverTimestampRef = useRef(0);
  const shownRoomRef = useRef(1);

  // Load game data and initialize engine
  useEffect(() => {
    let cancelled = false;
    fetchGameData()
      .then((gameData) => {
        if (cancelled) return;
        setData(gameData);
        const eng = createEngine(gameData, {
          randomEvents: true,
          debugInventory: isDebugInventoryEnabled(),
        });
        setEngine(eng);
        setGameState({ ...eng.state });
        shownRoomRef.current = eng.state.room;

        const startLines = eng.start();
        setLogText(startLines.join('\n') + '\n');

        // Preload artwork in background
        preloadAllRooms(eng.world, artMode);

        // Connect agent bridge if ?agent=1
        connectAgentBridge({
          engine: eng,
          handleCommand: (input) => handleExecuteCommand(input, eng),
        });
      })
      .catch((err) => {
        console.error('Failed to load game data:', err);
        setLogText(`\nFAILED TO START: ${err.message}\n`);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Synchronized Scene Artwork loading
  useEffect(() => {
    if (!engine || !gameState) return;
    const room = engine.world.room(gameState.room);
    if (!room) return;

    const candidates = artCandidates(room, gameState, artMode);
    let cancelled = false;
    setArtLoaded(false);

    let candidateIndex = 0;
    function tryNextCandidate() {
      if (cancelled) return;
      if (candidateIndex >= candidates.length) {
        setArtUrl(candidates[0] || '');
        setArtLoaded(true);
        return;
      }
      const url = candidates[candidateIndex++];
      const img = new Image();
      img.onload = () => {
        if (cancelled) return;
        setArtUrl(url);
        setArtLoaded(true);
      };
      img.onerror = () => {
        tryNextCandidate();
      };
      img.src = url;
    }

    tryNextCandidate();

    return () => {
      cancelled = true;
    };
  }, [engine, gameState?.room, gameState?.flags, gameState?.objectLoc, artMode]);

  // Command Execution
  const handleExecuteCommand = useCallback(
    (input, activeEngine = engine) => {
      if (!activeEngine) return;

      // Handle game over restart cooldown
      if (activeEngine.isGameOver()) {
        if (Date.now() - gameOverTimestampRef.current < 400) return;
        input = 'restart';
      }

      const trimmed = input.trim().toLowerCase();

      // UI Meta Commands
      if (trimmed === 'map' || trimmed === 'm') {
        setIsMapOpen(true);
      } else if (trimmed === 'scene' || (trimmed === 'close' && isMapOpen)) {
        setIsMapOpen(false);
      }

      // Handle restart
      if (trimmed === 'restart') {
        if (data) {
          const newEng = createEngine(data, {
            randomEvents: true,
            debugInventory: isDebugInventoryEnabled(),
          });
          setEngine(newEng);
          setGameState({ ...newEng.state });
          shownRoomRef.current = newEng.state.room;
          setGameOverInfo(null);
          gameOverTimestampRef.current = 0;
          setLogText(newEng.start().join('\n') + '\n');
          return;
        }
      }

      // Prime audio context on user action
      const ctx = getAudioContext();

      // Execute in engine
      const { echo, messages, events } = activeEngine.execute(input);
      if (echo === null) return;

      // Room change transcript clearing rule from BASIC (TRANS.bas:8000)
      let nextLog = '';
      if (activeEngine.state.room !== shownRoomRef.current) {
        shownRoomRef.current = activeEngine.state.room;
        nextLog = `> ${echo}\n${messages.join('\n')}\n`;
      } else {
        setLogText((prev) => `${prev}> ${echo}\n${messages.join('\n')}\n`);
      }
      if (nextLog) {
        setLogText(nextLog);
      }

      // Play sound and trigger visual effects
      if (events && events.length) {
        for (const evt of events) {
          if (ctx) {
            try {
              if (evt === 'teleport') playWhoosh(ctx);
              else if (evt === 'gameOver') playThud(ctx);
            } catch {}
          }
          if (evt === 'gameOver') {
            setJoltClass('fx-sink');
            setFlashClass('fx-flash-red');
          } else {
            setJoltClass('fx-jolt');
            setFlashClass('fx-flash');
          }
        }
        setTimeout(() => {
          setJoltClass('');
          setFlashClass('');
        }, 700);
      }

      // Check Game Over
      if (activeEngine.isGameOver()) {
        if (gameOverTimestampRef.current === 0) {
          gameOverTimestampRef.current = Date.now();
        }
        const info = getGameOverInfo(activeEngine.state);
        setGameOverInfo(info);
      } else {
        setGameOverInfo(null);
        gameOverTimestampRef.current = 0;
      }

      // Update reactive state
      setGameState({ ...activeEngine.state });

      // Preload surrounding rooms
      preloadSurroundings(activeEngine.world, activeEngine.state.room, activeEngine.state, artMode);
    },
    [engine, data, isMapOpen, artMode]
  );

  const toggleArt = useCallback(() => {
    setArtMode((prev) => {
      const next = prev === 'classic' ? 'enhanced' : 'classic';
      try {
        localStorage.setItem(ART_MODE_KEY, next);
      } catch {}
      return next;
    });
  }, []);

  const toggleDebug = useCallback(() => {
    toggleDebugInventory();
    location.reload();
  }, []);

  const restart = useCallback(() => {
    handleExecuteCommand('restart');
  }, [handleExecuteCommand]);

  return {
    engine,
    world: engine?.world,
    state: gameState,
    room: engine?.world && gameState ? engine.world.room(gameState.room) : null,
    turns: gameState?.turns ?? 0,
    visitedRooms: engine ? engine.getVisitedRooms() : [1],
    logText,
    artMode,
    artUrl,
    artLoaded,
    isMapOpen,
    isMapMaximized,
    gameOverInfo,
    joltClass,
    flashClass,
    executeCommand: handleExecuteCommand,
    toggleArt,
    openMap: () => setIsMapOpen(true),
    closeMap: () => setIsMapOpen(false),
    toggleMap: () => setIsMapOpen((prev) => !prev),
    toggleMapMaximize: () => setIsMapMaximized((prev) => !prev),
    restart,
    toggleDebug,
    debugActive: isDebugInventoryEnabled(),
  };
}
