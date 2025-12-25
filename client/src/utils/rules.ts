import type { Card, Rank, Suit } from '../types/card';
import type { GameState, ZoneType } from '../types/game';

export const getRankValue = (rank: Rank): number => {
  switch (rank) {
    case 'A': return 1;
    case 'J': return 11;
    case 'Q': return 12;
    case 'K': return 13;
    default: return parseInt(rank, 10);
  }
};

export const getSuitColor = (suit: Suit): 'red' | 'black' => {
  return (suit === 'hearts' || suit === 'diamonds') ? 'red' : 'black';
};

interface MoveContext {
    sourceCard: Card;
    targetZoneType: ZoneType;
    targetZoneIndex?: number;
    targetPlayerId?: string;
    gameState: GameState;
    currentPlayerId: string;
}

export const isValidMove = ({
    sourceCard,
    targetZoneType,
    targetZoneIndex,
    targetPlayerId,
    gameState,
    currentPlayerId
}: MoveContext): boolean => {

    // Helper to get top card of a pile
    const getTopCard = (cards: Card[]): Card | undefined => cards[cards.length - 1];

    // 1. Foundation Move: Same suit, Ascending (A -> K)
    if (targetZoneType === 'foundation') {
        if (targetZoneIndex === undefined) return false;
        const foundationPile = gameState.foundations[targetZoneIndex];
        const topCard = getTopCard(foundationPile);

        if (!topCard) {
            return sourceCard.rank === 'A';
        }

        return (
            sourceCard.suit === topCard.suit &&
            getRankValue(sourceCard.rank) === getRankValue(topCard.rank) + 1
        );
    }

    // 2. Tableau Move: Alternating Color, Descending
    if (targetZoneType === 'tableau') {
        if (targetZoneIndex === undefined) return false;
        const tableauPile = gameState.tableau[targetZoneIndex];
        const topCard = getTopCard(tableauPile);

        if (!topCard) {
            return true; // Empty tableau spot accepts any card
        }

        return (
            getSuitColor(sourceCard.suit) !== getSuitColor(topCard.suit) &&
            getRankValue(sourceCard.rank) === getRankValue(topCard.rank) - 1
        );
    }

    // 3. Opponent Piles (Waste / Crapette): Same suit, Rank +/- 1
    // Only allowed if target is NOT the current player
    if ((targetZoneType === 'waste' || targetZoneType === 'crapette') && targetPlayerId && targetPlayerId !== currentPlayerId) {
        const opponentState = gameState.players[targetPlayerId];
        if (!opponentState) return false;

        const pile = targetZoneType === 'waste' ? opponentState.waste : opponentState.crapettePile;
        const topCard = getTopCard(pile);

        if (!topCard) return false; // Cannot load onto empty opponent pile (usually)

        return (
            sourceCard.suit === topCard.suit &&
            (Math.abs(getRankValue(sourceCard.rank) - getRankValue(topCard.rank)) === 1)
        );
    }

    return false;
};
