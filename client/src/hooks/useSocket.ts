import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SERVER_URL = 'http://localhost:3002';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [matchData, setMatchData] = useState<{ roomId: string, playerId: string, opponentId: string } | null>(null);

  useEffect(() => {
    socketRef.current = io(SERVER_URL);

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      console.log('[Client] Socket connected:', socketRef.current?.id);
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
      console.log('[Client] Socket disconnected');
    });

    socketRef.current.on('game_start', (data) => {
      console.log('[Client] Game Start Event:', data);
      setMatchData(data);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const joinGame = useCallback(() => {
    socketRef.current?.emit('join_game');
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    matchData,
    joinGame
  };
};
