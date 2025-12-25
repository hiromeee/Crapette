import { useState } from 'react';
import { DndContext } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { GameBoard } from './components/GameBoard';
import type { GameState, PlayerState } from './types/game';
import type { Card } from './types/card';

// Mock Data Generation
const createCard = (id: string, suit: any, rank: any, faceUp = true): Card => ({
  id, suit, rank, faceUp
});

const mockPlayer: PlayerState = {
  id: 'player1',
  name: 'Player 1',
  hand: [
    createCard('h1', 'hearts', 'A'),
    createCard('h2', 'spades', 'K'),
    createCard('h3', 'diamonds', '10'),
    createCard('h4', 'clubs', '5'),
    createCard('h5', 'hearts', '7'),
  ],
  stock: [createCard('s1', 'clubs', '2', false)],
  waste: [createCard('w1', 'diamonds', 'Q')],
  crapettePile: [createCard('c1', 'spades', 'A')],
};

const mockOpponent: PlayerState = {
  id: 'opponent1',
  name: 'Opponent',
  hand: [], // Opponent hand usually hidden or not rendered fully
  stock: [createCard('os1', 'hearts', '3', false)],
  waste: [createCard('ow1', 'clubs', 'J')],
  crapettePile: [createCard('oc1', 'diamonds', 'K')],
};

const initialGameState: GameState = {
  players: {
    'player1': mockPlayer,
    'opponent1': mockOpponent,
  },
  tableau: Array(8).fill([]).map((_, i) => i === 0 ? [createCard(`t${i}`, 'hearts', '6')] : []),
  foundations: Array(8).fill([]),
  currentPlayerId: 'player1',
};

function App() {
  const [gameState] = useState<GameState>(initialGameState);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over) {
      console.log(`Dropped card ${active.id} over zone ${over.id}`);
      // Logic will be implemented in next steps
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-green-800 flex items-center justify-center">
        <GameBoard gameState={gameState} playerId="player1" />
      </div>
    </DndContext>
  );
}

export default App;
