'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { KanbanColumn } from './KanbanColumn';
import { COLUMNS, type KanbanStatus } from '@/types';
import { cn } from '@/lib/utils';

export function KanbanBoard({ searchQuery = '' }: { searchQuery?: string }) {
  const { cards } = useApp();
  const [activeColumnIndex, setActiveColumnIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const getCardsByStatus = (status: KanbanStatus) => {
    const filtered = cards.filter((card) => card.status === status);
    if (!searchQuery.trim()) return filtered;
    const q = searchQuery.toLowerCase();
    return filtered.filter((card) =>
      card.title.toLowerCase().includes(q) ||
      (card.description && card.description.toLowerCase().includes(q))
    );
  };

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollLeft = container.scrollLeft;
    const columnWidth = container.scrollWidth / COLUMNS.length;
    const newIndex = Math.round(scrollLeft / columnWidth);
    setActiveColumnIndex(Math.min(Math.max(newIndex, 0), COLUMNS.length - 1));
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const scrollToColumn = (index: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const columnWidth = container.scrollWidth / COLUMNS.length;
    container.scrollTo({
      left: columnWidth * index,
      behavior: 'smooth',
    });
  };

  return (
    <div className="relative h-full flex flex-col">
      <div
        ref={scrollContainerRef}
        className="flex flex-col md:flex-row gap-4 md:gap-6 p-4 md:p-6 flex-1 overflow-y-auto md:overflow-x-auto"
      >
        {COLUMNS.map((column, index) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            cards={getCardsByStatus(column.id)}
            animationDelay={index}
          />
        ))}
        <div className="h-4 md:h-0 md:w-0 flex-shrink-0" />
      </div>

      <div className="hidden justify-center gap-2 pb-4 pt-2 bg-gradient-to-t from-background to-transparent">
        {COLUMNS.map((column, index) => (
          <button
            key={column.id}
            type="button"
            onClick={() => scrollToColumn(index)}
            onTouchEnd={(e) => {
              e.stopPropagation();
              scrollToColumn(index);
            }}
            className={cn(
              'w-2 h-2 rounded-full transition-all duration-300 touch-manipulation',
              activeColumnIndex === index
                ? 'bg-accent w-6'
                : 'bg-border hover:bg-text-dim'
            )}
            aria-label={`Go to ${column.title} column`}
          />
        ))}
      </div>
    </div>
  );
}
