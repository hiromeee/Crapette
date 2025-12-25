import type { Card } from './card.js';

export interface PlayerState {
  id: string;
  name: string;
  hand: Card[];
  stock: Card[]; // 山札
  waste: Card[]; // 捨て札
  crapettePile: Card[]; // Crapette山
}

export interface GameState {
  players: {
    [playerId: string]: PlayerState;
  };
  tableau: Card[][]; // 8列の場札
  foundations: Card[][]; // 8つの基礎札 (A-K)
  currentPlayerId: string;
}

export type ZoneType = 'tableau' | 'foundation' | 'waste' | 'crapette' | 'stock';

export interface DropZone {
  id: string;
  type: ZoneType;
  index?: number; // For tableau/foundation index
  playerId?: string; // For player specific zones
}
