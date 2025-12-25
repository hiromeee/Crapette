import type { Card, Suit, Rank } from '../types/card.js';

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const createDeck = (): Card[] => {
  const deck: Card[] = [];
  SUITS.forEach((suit) => {
    RANKS.forEach((rank) => {
      deck.push({
        id: `${suit}-${rank}-${Math.random().toString(36).substr(2, 9)}`,
        suit,
        rank,
        faceUp: false,
      });
    });
  });
  return deck;
};

export const shuffle = (cards: Card[]): Card[] => {
  const newCards = [...cards];
  for (let i = newCards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = newCards[i];
    newCards[i] = newCards[j]!;
    newCards[j] = temp!;
  }
  return newCards;
};

export const initializeGameDeck = (): { playerDeck: Card[], opponentDeck: Card[] } => {
  const deck1 = shuffle(createDeck());
  const deck2 = shuffle(createDeck());
  return { playerDeck: deck1, opponentDeck: deck2 };
};
