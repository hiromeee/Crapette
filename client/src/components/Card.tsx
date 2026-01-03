import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { Card as CardType } from '../types/card';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps {
  card: CardType;
  className?: string;
  disabled?: boolean;
}

const suitSymbols: Record<string, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const suitColors: Record<string, string> = {
  hearts: 'text-red-600',
  diamonds: 'text-red-600',
  clubs: 'text-black',
  spades: 'text-black',
};

export const Card = ({ card, className, disabled }: CardProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
    data: card,
    disabled: disabled || !card.faceUp, // Ensure disabled prop is respected
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  if (!card.faceUp) {
    return (
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        role={attributes.role as React.AriaRole}
        tabIndex={attributes.tabIndex}
        style={style}
        className={twMerge(
          "w-16 h-24 bg-blue-700 rounded-lg border-2 border-white shadow-md flex items-center justify-center select-none",
          isDragging && "opacity-50 z-50",
          className
        )}
      >
        <div className="w-12 h-20 border border-blue-400 rounded opacity-50 bg-pattern"></div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      role={attributes.role as React.AriaRole}
      tabIndex={attributes.tabIndex}
      style={style}
      className={twMerge(
        "w-16 h-24 bg-white rounded-lg border border-gray-300 shadow-md flex flex-col items-center justify-between p-1 select-none",
        disabled ? "cursor-not-allowed opacity-70" : "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50 z-50",
        className
      )}
    >
      <div className={clsx("text-sm font-bold self-start", suitColors[card.suit])}>
        {card.rank}{suitSymbols[card.suit]}
      </div>
      <div className={clsx("text-2xl", suitColors[card.suit])}>
        {suitSymbols[card.suit]}
      </div>
      <div className={clsx("text-sm font-bold self-end rotate-180", suitColors[card.suit])}>
        {card.rank}{suitSymbols[card.suit]}
      </div>
    </div>
  );
};
