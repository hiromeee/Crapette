import React from 'react';
import type { GameState } from '../types/game';
import type { Card as CardType } from '../types/card';
import { Card } from './Card';
import { Zone } from './Zone';

interface GameBoardProps {
  gameState: GameState;
  playerId: string; // 'player' or 'opponent'
}

export const GameBoard: React.FC<GameBoardProps> = ({ gameState, playerId }) => {
  const player = gameState.players[playerId];
  const opponentId = Object.keys(gameState.players).find(id => id !== playerId) || 'opponent';
  const opponent = gameState.players[opponentId];

  const renderPile = (cards: CardType[], zoneId: string, emptyPlaceholder: string) => {
    const topCard = cards[cards.length - 1];
    return (
      <Zone id={zoneId} placeholder={emptyPlaceholder}>
        {topCard && <Card card={topCard} />}
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
                {opponent && renderPile(opponent.stock, `stock-${opponentId}`, 'Stock')}
                {opponent && renderPile(opponent.waste, `waste-${opponentId}`, 'Waste')}
                {opponent && renderPile(opponent.crapettePile, `crapette-${opponentId}`, 'Crapette')}
             </div>
           </div>
        </div>
        <div className="text-white/50 text-sm">Opponent Hand: {opponent?.hand.length ?? 0}</div>
      </div>

      {/* Center Area (Foundations & Tableau) */}
      <div className="flex-1 flex flex-col justify-center gap-8">
        {/* Foundations (8 slots) */}
        <div className="flex justify-center gap-2 flex-wrap">
          {gameState.foundations.map((pile, index) => (
            <Zone key={`foundation-${index}`} id={`foundation-${index}`} placeholder="A">
              {pile.length > 0 && <Card card={pile[pile.length - 1]} />}
            </Zone>
          ))}
        </div>

        {/* Tableau (8 slots) */}
        <div className="flex justify-center gap-2 flex-wrap">
          {gameState.tableau.map((pile, index) => (
            <div key={`tableau-${index}`} className="relative">
               {/* Tableau is a stack, but for now just showing top card or empty zone */}
               {/* In real game, tableau is cascaded. For step 1, just top card is fine or simple stack */}
               <Zone id={`tableau-${index}`} placeholder="Tableau">
                 {pile.length > 0 && <Card card={pile[pile.length - 1]} />}
               </Zone>
               {/* Visual stack effect could be added here later */}
            </div>
          ))}
        </div>
      </div>

      {/* Player Area (Bottom) */}
      <div className="flex justify-between items-end bg-black/20 p-4 rounded-xl">
        <div className="flex gap-4">
           {/* Player Stock & Waste & Crapette */}
           <div className="flex flex-col gap-2 items-center">
             <span className="text-xs text-white/50">You</span>
             <div className="flex gap-2">
                {renderPile(player.crapettePile, `crapette-${playerId}`, 'Crapette')}
                {renderPile(player.waste, `waste-${playerId}`, 'Waste')}
                {renderPile(player.stock, `stock-${playerId}`, 'Stock')}
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
