import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initializeGameDeck } from './utils/deck.js';
import type { GameState, PlayerState } from './types/game.js';
import type { Card } from './types/card.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

interface Room {
  id: string;
  players: string[]; // [player1Id, player2Id]
  gameState?: GameState;
}

const rooms: Record<string, Room> = {};
const waitingQueue: string[] = [];

const INITIAL_CRAPETTE_SIZE = 13;
const INITIAL_TABLEAU_SIZE = 4;

const generateInitialState = (p1Id: string, p2Id: string): GameState => {
    const { playerDeck, opponentDeck } = initializeGameDeck();

    const setupPlayer = (id: string, name: string, deck: Card[]): PlayerState => {
      const crapettePile = deck.splice(0, INITIAL_CRAPETTE_SIZE);
      if (crapettePile.length > 0) {
        crapettePile[crapettePile.length - 1].faceUp = true;
      }

      const stock = deck;

      return {
        id,
        name,
        hand: [],
        stock,
        waste: [],
        crapettePile,
      };
    };

    // Use 'player1' and 'player2' as IDs internally in GameState
    const p1 = setupPlayer('player1', 'Player 1', playerDeck);
    const p2 = setupPlayer('player2', 'Player 2', opponentDeck);

    // Deal to tableau from P1 stock
    const tableau: Card[][] = Array(8).fill([]).map(() => []);
    for (let i = 0; i < INITIAL_TABLEAU_SIZE; i++) {
        const card = p1.stock.pop();
        if (card) {
            card.faceUp = true;
            tableau[i] = [card];
        }
    }

    return {
      players: {
        'player1': p1,
        'player2': p2,
      },
      tableau,
      foundations: Array(8).fill([]),
      currentPlayerId: 'player1', // Player 1 starts
    };
};

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('join_game', () => {
    if (waitingQueue.length > 0) {
      const opponentId = waitingQueue.shift();
      
      if (opponentId && opponentId !== socket.id) {
        const roomId = `${opponentId}-${socket.id}`;
        rooms[roomId] = {
            id: roomId,
            players: [opponentId, socket.id]
        };

        // Join both to room
        io.sockets.sockets.get(opponentId)?.join(roomId);
        socket.join(roomId);

        console.log(`Match found! Room: ${roomId}, Players: ${opponentId} vs ${socket.id}`);

        // Generate Authoritative State
        const initialState = generateInitialState(opponentId, socket.id);
        rooms[roomId].gameState = initialState;

        // Atomic Game Start Broadcast
        const payload = {
            roomId,
            gameState: initialState,
            players: {
                [opponentId]: 'player1',
                [socket.id]: 'player2'
            },
            activePlayer: initialState.currentPlayerId
        };

        io.to(roomId).emit('game_start', payload);
        console.log(`Game started event sent to ${roomId}`);

      } else {
        waitingQueue.push(socket.id);
        console.log(`Opponent ${opponentId} not found/valid. Re-queueing ${socket.id}`);
      }
    } else {
      waitingQueue.push(socket.id);
      console.log(`Added ${socket.id} to waiting queue. Queue size: ${waitingQueue.length}`);
    }
  });

  socket.on('action_move', (data) => {
      // Relay move to opponent
      socket.to(data.roomId).emit('action_update', data.move);
      // TODO: Update server-side state if we want full validation later
  });

  socket.on('end_turn', (data: { roomId: string, playerId?: string }) => {
      const room = rooms[data.roomId];
      if (room && room.gameState) {
          // Identify requesting player: Prefer payload ID, fallback to socket map
          const requestingPlayerId = data.playerId || (room.players[0] === socket.id ? 'player1' : (room.players[1] === socket.id ? 'player2' : null));
          
          if (!requestingPlayerId) {
             console.warn(`[Server] Unknown socket ${socket.id} tried to end turn in room ${data.roomId}`);
             return;
          }

          const current = room.gameState.currentPlayerId;
          
          console.log(`[Server] End turn req from: ${requestingPlayerId} (Active: ${current})`);

          // Validation: Only active player can end turn
          if (requestingPlayerId !== current) {
              console.warn(`[Server] Request ignored. ${requestingPlayerId} tried to end turn, but it is ${current}'s turn.`);
              return;
          }
          
          // Toggle logic: Strict string literal toggling
          const nextPlayer = (current === 'player1') ? 'player2' : 'player1';
          
          room.gameState.currentPlayerId = nextPlayer;
          
          io.to(data.roomId).emit('turn_update', { activePlayer: nextPlayer });
          console.log(`Turn switched in ${data.roomId}: ${current} -> ${nextPlayer}`);
      }
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    
    // Remove from queue
    const queueIndex = waitingQueue.indexOf(socket.id);
    if (queueIndex > -1) {
        waitingQueue.splice(queueIndex, 1);
        console.log(`Removed ${socket.id} from waiting queue`);
    }

    // Notify opponent in active rooms
    for (const roomId in rooms) {
      const room = rooms[roomId];
      if (room && room.players.includes(socket.id)) {
        socket.to(roomId).emit('opponent_disconnected');
        delete rooms[roomId];
        break;
      }
    }
  });
});

const PORT = 3002;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
