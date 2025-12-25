import { useEffect } from 'react';
import { DndContext } from '@dnd-kit/core';
import { GameBoard } from './components/GameBoard';
import { useGameLogic } from './hooks/useGameLogic';

function App() {
  const playerId = 'player1';
  const { gameState, initializeGame, handleDragEnd } = useGameLogic(playerId);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  if (!gameState) {
      return <div className="text-white">Loading...</div>;
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-green-800 flex items-center justify-center">
        <GameBoard gameState={gameState} playerId={playerId} />
      </div>
    </DndContext>
  );
}

export default App;
