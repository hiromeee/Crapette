import React from 'react';
import { useDroppable } from '@dnd-kit/core';

import { twMerge } from 'tailwind-merge';

import type { DropZone } from '../types/game';

interface ZoneProps {
  id: string;
  children?: React.ReactNode;
  className?: string;
  placeholder?: string;
  data?: DropZone;
}

export const Zone: React.FC<ZoneProps> = ({ id, children, className, placeholder, data }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
    data: data,
  });

  return (
    <div
      ref={setNodeRef}
      className={twMerge(
        "w-16 h-24 rounded-lg border-2 border-dashed border-gray-400 flex items-center justify-center transition-colors",
        isOver && "bg-green-600/30 border-green-300",
        className
      )}
    >
      {children ? children : <span className="text-xs text-white/30">{placeholder}</span>}
    </div>
  );
};
