import { useState, useCallback, useEffect } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import type { GameState, DropZone } from '../types/game';
import type { Card } from '../types/card';
import { isValidMove } from '../utils/rules';
import type { Socket } from 'socket.io-client';

export const useGameLogic = (socket: Socket | null) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [playerLabel, setPlayerLabel] = useState<'player1' | 'player2' | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);

  // Listen for Socket Events
  useEffect(() => {
    if (!socket) return;

    // Atomic Game Start
    socket.on('game_start', (data: { roomId: string, gameState: GameState, players: Record<string, 'player1' | 'player2'>, activePlayer: string }) => {
        console.log('[Client] Received game_start:', data);
        
        if (!data.players) {
            console.error('[Client] Received game_start without players map. Server might be running old code. Please restart the server.');
            return;
        }

        const myId = socket.id;
        if (!myId) return;

        setRoomId(data.roomId);
        setGameState(data.gameState);
        setMyPlayerId(myId);
        setPlayerLabel(data.players[myId]);
        setIsActive(true);
    });

    socket.on('action_update', (move: { source: Card, target: DropZone }) => {
        console.log('[Client] Received action_update:', move);
        
        // Apply opponent's move to local state
        setGameState(prevState => {
            if (!prevState) return null;
            const newState = JSON.parse(JSON.stringify(prevState)) as GameState;
            
            // Apply move logic (same as handleDragEnd but without validation or with simplified validation)
            
            const sourceCard = move.source;
            const dropData = move.target;

            // 1. Remove from source
            let sourceZone: Card[] | null = null;
            Object.values(newState.players).forEach(p => {
                if (p.hand.find(c => c.id === sourceCard.id)) sourceZone = p.hand;
                if (p.waste.find(c => c.id === sourceCard.id)) sourceZone = p.waste;
                if (p.crapettePile.find(c => c.id === sourceCard.id)) sourceZone = p.crapettePile;
                if (p.stock.find(c => c.id === sourceCard.id)) sourceZone = p.stock; 
            });

            if (!sourceZone) {
                newState.tableau.forEach(pile => {
                    if (pile.find(c => c.id === sourceCard.id)) sourceZone = pile;
                });
            }
            
             if (!sourceZone) {
                newState.foundations.forEach(pile => {
                    if (pile.find(c => c.id === sourceCard.id)) sourceZone = pile;
                });
            }

            if (sourceZone) {
                const index = (sourceZone as Card[]).findIndex(c => c.id === sourceCard.id);
                if (index > -1) (sourceZone as Card[]).splice(index, 1);

                // Flip logic (simplified)
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
    });
    
    return () => {
      socket.off('game_start');
      socket.off('action_update');
    };
  }, [socket]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !gameState || !myPlayerId) return;

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
        currentPlayerId: myPlayerId
    });

    if (valid) {
        setGameState(prevState => {
            if (!prevState) return null;
            
            const newState = JSON.parse(JSON.stringify(prevState)) as GameState;
            
            // 1. Remove card from source
            let sourceZone: Card[] | null = null;
            
            Object.values(newState.players).forEach(p => {
                if (p.hand.find(c => c.id === sourceCard.id)) sourceZone = p.hand;
                if (p.waste.find(c => c.id === sourceCard.id)) sourceZone = p.waste;
                if (p.crapettePile.find(c => c.id === sourceCard.id)) sourceZone = p.crapettePile;
            });

            if (!sourceZone) {
                newState.tableau.forEach(pile => {
                    if (pile.find(c => c.id === sourceCard.id)) sourceZone = pile;
                });
            }
            
             if (!sourceZone) {
                newState.foundations.forEach(pile => {
                    if (pile.find(c => c.id === sourceCard.id)) sourceZone = pile;
                });
            }

            if (sourceZone) {
                const index = (sourceZone as Card[]).findIndex(c => c.id === sourceCard.id);
                if (index > -1) (sourceZone as Card[]).splice(index, 1);

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

            // Emit move to server
            if (socket && roomId) {
                socket.emit('action_move', { 
                    roomId, 
                    move: { 
                        source: sourceCard, 
                        target: dropData 
                    } 
                });
            }

            return newState;
        });
    } else {
        console.log('Invalid Move');
    }

  }, [gameState, myPlayerId, socket, roomId]);

  return {
    gameState,
    myPlayerId,
    playerLabel,
    isActive,
    handleDragEnd
  };
};
