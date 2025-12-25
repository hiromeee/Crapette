import { DndContext } from '@dnd-kit/core';
import { GameBoard } from './components/GameBoard';
import { useGameLogic } from './hooks/useGameLogic';
import { useSocket } from './hooks/useSocket';

function App() {
  const { socket, isConnected, joinGame } = useSocket();
  const { gameState, myPlayerId, playerLabel, isActive, handleDragEnd, endTurn } = useGameLogic(socket);

  return (
    <div className="min-h-screen bg-green-800 flex items-center justify-center overflow-hidden">
      {!isActive ? (
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-8">Crapette</h1>
          <div className="space-y-4">
            <div className="text-white mb-4">
                Status: {isConnected ? <span className="text-green-400">Connected</span> : <span className="text-red-400">Disconnected</span>}
            </div>
            <button 
              onClick={joinGame}
              disabled={!isConnected}
              className="px-8 py-4 bg-white text-green-800 rounded-lg font-bold text-xl hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Find Match
            </button>
          </div>
        </div>
      ) : (
        gameState && myPlayerId && (
            <DndContext onDragEnd={handleDragEnd}>
            <GameBoard 
                gameState={gameState} 
                playerId={myPlayerId} 
                playerLabel={playerLabel} 
                onEndTurn={endTurn}
            />
            </DndContext>
        )
      )}
    </div>
  );
}

export default App;
