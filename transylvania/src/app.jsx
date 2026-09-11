import { useEffect } from 'preact/hooks';
import { useGame } from './hooks/useGame.js';
import { useResponsive } from './hooks/useResponsive.js';
import { Stage } from './components/Stage.jsx';
import { Console } from './components/Console.jsx';
import { MapDrawer } from './components/MapDrawer.jsx';
import { CommandRow } from './components/CommandRow.jsx';

export function App() {
  const {
    room,
    state,
    world,
    turns,
    visitedRooms,
    logText,
    artMode,
    artUrl,
    artLoaded,
    isMapOpen,
    isMapMaximized,
    gameOverInfo,
    joltClass,
    flashClass,
    executeCommand,
    toggleArt,
    openMap,
    closeMap,
    toggleMapMaximize,
    restart,
    toggleDebug,
    debugActive,
  } = useGame();

  const { isMobile } = useResponsive();

  // Global keydown handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Escape closes map
      if (e.key === 'Escape' && isMapOpen) {
        closeMap();
        return;
      }

      // Any key restarts on Game Over
      if (gameOverInfo) {
        if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) {
          return;
        }
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
        }
        restart();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMapOpen, gameOverInfo, closeMap, restart]);

  return (
    <div id="app">
      <Stage
        room={room}
        state={state}
        world={world}
        artUrl={artUrl}
        artLoaded={artLoaded}
        onAction={executeCommand}
        gameOverInfo={gameOverInfo}
        onRestart={restart}
        onOpenMap={openMap}
        visitedRooms={visitedRooms}
        isMobile={isMobile}
        commandRow={
          !isMobile ? (
            <CommandRow
              onCommand={executeCommand}
              disabled={Boolean(gameOverInfo)}
            />
          ) : null
        }
        joltClass={joltClass}
        flashClass={flashClass}
      />

      <Console
        turns={turns}
        artMode={artMode}
        onToggleArt={toggleArt}
        onToggleMap={openMap}
        onSave={() => executeCommand('save')}
        onLoad={() => executeCommand('restore')}
        debugActive={debugActive}
        onToggleDebug={toggleDebug}
        logContent={logText}
        logFlashClass={flashClass}
        room={room}
        state={state}
        world={world}
        onCommand={executeCommand}
        commandRow={
          isMobile ? (
            <CommandRow
              onCommand={executeCommand}
              disabled={Boolean(gameOverInfo)}
            />
          ) : null
        }
      />

      <MapDrawer
        isOpen={isMapOpen}
        isMaximized={isMapMaximized}
        onToggleMaximize={toggleMapMaximize}
        onClose={closeMap}
        currentRoom={state?.room ?? 1}
        visitedRooms={visitedRooms}
        world={world}
        state={state}
      />
    </div>
  );
}
