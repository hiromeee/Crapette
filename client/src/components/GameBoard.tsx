import React from 'react';
import type { GameState } from '../types/game';
import type { Card as CardType } from '../types/card';
import { Card } from './Card';
import { Zone } from './Zone';

interface GameBoardProps {
  gameState: GameState;
  playerId: string;
  playerLabel?: 'player1' | 'player2' | null;
}

export const GameBoard: React.FC<GameBoardProps> = ({ gameState, playerId, playerLabel }) => {
  const player = gameState.players[playerId];
  // Find opponent ID: It's the key in players that is NOT my playerId
  const opponentId = Object.keys(gameState.players).find(id => id !== playerId);
  const opponent = opponentId ? gameState.players[opponentId] : undefined;
  
  const isMyTurn = gameState.currentPlayerId === playerId;

  // Mirrored View Logic
  const isMirrored = playerLabel === 'player2';

  const foundationsToRender = isMirrored 
    ? [...gameState.foundations].reverse() 
    : gameState.foundations;
    
  const tableauToRender = isMirrored
    ? [...gameState.tableau].reverse()
    : gameState.tableau;

  // Helper to get original index
  const getOriginalIndex = (index: number) => isMirrored ? 7 - index : index;

  const renderPile = (cards: CardType[], zoneId: string, emptyPlaceholder: string, type: any, ownerId?: string) => {
    const topCard = cards[cards.length - 1];
    
    // Disable if:
    // 1. Not my turn
    // 2. Card belongs to opponent (ownerId exists and is not me)
    // Note: Tableau/Foundation don't have ownerId passed usually, or we can treat them as neutral (enabled if my turn)
    
    const isDisabled = !isMyTurn || (!!ownerId && ownerId !== playerId);

    return (
      <Zone 
        id={zoneId} 
        placeholder={emptyPlaceholder}
        data={{ id: zoneId, type, playerId: ownerId }}
      >
        {topCard && <Card card={topCard} disabled={isDisabled} />}
      </Zone>
    );
  };

  return (
    <div className="flex flex-col h-screen w-full p-4 gap-4 max-w-6xl mx-auto">
      {/* Opponent Area (Top) */}
      <div className="flex justify-between items-start bg-black/20 p-4 rounded-xl">
        <div className="flex gap-4">
           {/* Opponent Stock & Waste & Crapette */}
           <div className="flex flex-col gap-2 items-center">
             <span className="text-xs text-white/50">Opponent</span>
             <div className="flex gap-2">
                {opponent && renderPile(opponent.stock, `stock-${opponentId}`, 'Stock', 'stock', opponentId)}
                {opponent && renderPile(opponent.waste, `waste-${opponentId}`, 'Waste', 'waste', opponentId)}
                {opponent && renderPile(opponent.crapettePile, `crapette-${opponentId}`, 'Crapette', 'crapette', opponentId)}
             </div>
           </div>
        </div>
        <div className="text-white/50 text-sm">Opponent Hand: {opponent?.hand.length ?? 0}</div>
      </div>

      {/* Center Area (Foundations & Tableau) */}
      <div className="flex-1 flex flex-col justify-center gap-8">
        {/* Foundations (8 slots) */}
        <div className="flex justify-center gap-2 flex-wrap">
          {foundationsToRender.map((pile, i) => {
            const originalIndex = getOriginalIndex(i);
            return (
            <Zone 
                key={`foundation-${originalIndex}`} 
                id={`foundation-${originalIndex}`} 
                placeholder="A"
                data={{ id: `foundation-${originalIndex}`, type: 'foundation', index: originalIndex }}
            >
              {pile.length > 0 && <Card card={pile[pile.length - 1]} disabled={!isMyTurn} />}
            </Zone>
            );
          })}
        </div>

        {/* Tableau (8 slots) */}
        <div className="flex justify-center gap-2 flex-wrap">
          {tableauToRender.map((pile, i) => {
            const originalIndex = getOriginalIndex(i);
            return (
            <div key={`tableau-${originalIndex}`} className="relative">
               <Zone 
                id={`tableau-${originalIndex}`} 
                placeholder="Tableau"
                data={{ id: `tableau-${originalIndex}`, type: 'tableau', index: originalIndex }}
               >
                 {pile.length > 0 && <Card card={pile[pile.length - 1]} disabled={!isMyTurn} />}
               </Zone>
            </div>
            );
          })}
        </div>
      </div>

      {/* Player Area (Bottom) */}
      <div className="flex justify-between items-end bg-black/20 p-4 rounded-xl">
        <div className="flex gap-4">
           {/* Player Stock & Waste & Crapette */}
           <div className="flex flex-col gap-2 items-center">
             <span className="text-xs text-white/50">You</span>
             <div className="flex gap-2">
                {renderPile(player.crapettePile, `crapette-${playerId}`, 'Crapette', 'crapette', playerId)}
                {renderPile(player.waste, `waste-${playerId}`, 'Waste', 'waste', playerId)}
                {renderPile(player.stock, `stock-${playerId}`, 'Stock', 'stock', playerId)}
             </div>
           </div>
        </div>
        
        {/* Hand */}
        <div className="flex -space-x-8 hover:space-x-2 transition-all p-2">
            {player.hand.map((card) => (
                <div key={card.id} className="transition-transform hover:-translate-y-4">
                    <Card card={card} />
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};
