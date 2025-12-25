import { useState, useCallback } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import type { GameState, PlayerState, DropZone } from '../types/game';
import type { Card } from '../types/card';
import { initializeGameDeck } from '../utils/deck';
import { isValidMove } from '../utils/rules';

const INITIAL_CRAPETTE_SIZE = 13;
const INITIAL_TABLEAU_SIZE = 4; // First 4 slots get 1 card each

export const useGameLogic = (playerId: string) => {
  const [gameState, setGameState] = useState<GameState | null>(null);

  const initializeGame = useCallback(() => {
    const { playerDeck, opponentDeck } = initializeGameDeck();

    const setupPlayer = (id: string, name: string, deck: Card[]): PlayerState => {
      const crapettePile = deck.splice(0, INITIAL_CRAPETTE_SIZE);
      crapettePile[crapettePile.length - 1].faceUp = true; // Top card face up

      const stock = deck; // Rest is stock
      // Stock is all face down by default from createDeck

      return {
        id,
        name,
        hand: [], // Hand starts empty? Or draw some? Usually empty at start of turn
        stock,
        waste: [],
        crapettePile,
      };
    };

    // Initial Tableau Deal: 4 cards from somewhere? 
    // Russian Bank rules: "The first four cards from the stock are dealt face up to the tableau."
    // Let's take from player 1's stock for now or shared? 
    // Actually, usually tableau is built during play, but let's put 4 cards from Player 1's stock to start.
    
    const p1 = setupPlayer(playerId, 'You', playerDeck);
    const p2 = setupPlayer('opponent', 'Opponent', opponentDeck);

    // Deal to tableau from P1 stock (simplified)
    const tableau: Card[][] = Array(8).fill([]).map(() => []);
    for (let i = 0; i < INITIAL_TABLEAU_SIZE; i++) {
        const card = p1.stock.pop();
        if (card) {
            card.faceUp = true;
            tableau[i] = [card];
        }
    }

    setGameState({
      players: {
        [playerId]: p1,
        'opponent': p2,
      },
      tableau,
      foundations: Array(8).fill([]),
      currentPlayerId: playerId,
    });
  }, [playerId]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !gameState) return;

    const sourceCard = active.data.current as Card;
    const dropData = over.data.current as DropZone;

    if (!sourceCard || !dropData) return;

    // Validate Move
    const valid = isValidMove({
        sourceCard,
        targetZoneType: dropData.type,
        targetZoneIndex: dropData.index,
        targetPlayerId: dropData.playerId,
        gameState,
        currentPlayerId: playerId
    });

    if (valid) {
        setGameState(prevState => {
            if (!prevState) return null;
            
            // Deep copy (simplified for now, ideally use Immer)
            const newState = JSON.parse(JSON.stringify(prevState)) as GameState;
            
            // 1. Remove card from source
            // We need to know where it came from. 
            // For now, let's search for it. In optimized version, pass source info.
            let sourceZone: Card[] | null = null;
            
            // Search in players
            Object.values(newState.players).forEach(p => {
                if (p.hand.find(c => c.id === sourceCard.id)) sourceZone = p.hand;
                if (p.waste.find(c => c.id === sourceCard.id)) sourceZone = p.waste;
                if (p.crapettePile.find(c => c.id === sourceCard.id)) sourceZone = p.crapettePile;
                // Stock usually not draggable directly unless flipped, but let's assume waste/crapette/hand/tableau
            });

            // Search in tableau
            if (!sourceZone) {
                newState.tableau.forEach(pile => {
                    if (pile.find(c => c.id === sourceCard.id)) sourceZone = pile;
                });
            }
            
            // Search in foundations (usually not allowed to move FROM foundation, but technically possible)
             if (!sourceZone) {
                newState.foundations.forEach(pile => {
                    if (pile.find(c => c.id === sourceCard.id)) sourceZone = pile;
                });
            }

            if (sourceZone) {
                // Remove from source
                const index = (sourceZone as Card[]).findIndex(c => c.id === sourceCard.id);
                if (index > -1) (sourceZone as Card[]).splice(index, 1);

                // Flip new top card of source if it was Crapette or Stock (if we supported stock drag)
                // For Crapette pile:
                Object.values(newState.players).forEach(p => {
                     if (p.crapettePile === sourceZone && p.crapettePile.length > 0) {
                         p.crapettePile[p.crapettePile.length - 1].faceUp = true;
                     }
                });
            }

            // 2. Add to destination
            let targetPile: Card[] | null = null;
            if (dropData.type === 'foundation' && dropData.index !== undefined) {
                targetPile = newState.foundations[dropData.index];
            } else if (dropData.type === 'tableau' && dropData.index !== undefined) {
                targetPile = newState.tableau[dropData.index];
            } else if (dropData.type === 'waste' && dropData.playerId) {
                targetPile = newState.players[dropData.playerId].waste;
            } else if (dropData.type === 'crapette' && dropData.playerId) {
                targetPile = newState.players[dropData.playerId].crapettePile;
            }

            if (targetPile) {
                targetPile.push(sourceCard);
            }

            return newState;
        });
    } else {
        console.log('Invalid Move');
    }

  }, [gameState, playerId]);

  return {
    gameState,
    initializeGame,
    handleDragEnd
  };
};
