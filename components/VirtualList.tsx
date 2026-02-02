
import React, { useState, useRef, useEffect, useMemo } from 'react';

interface VirtualListProps<T> {
  items: T[];
  height: number; // Viewport height
  itemHeight: number; // Approximate item height for calculation
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
}

export const VirtualList = <T extends any>({ items, height, itemHeight, renderItem, className }: VirtualListProps<T>) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Buffer items to prevent flickering during fast scroll
  const buffer = 4;
  
  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
  const endIndex = Math.min(
    items.length - 1,
    Math.floor((scrollTop + height) / itemHeight) + buffer
  );

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      originalIndex: startIndex + index,
    }));
  }, [items, startIndex, endIndex]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    // Throttling could be added here for even better performance
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`overflow-y-auto relative scrollbar-hide ${className}`}
      style={{ height }}
      role="list"
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: startIndex * itemHeight,
            left: 0,
            right: 0,
            // Transform is more performant than top/left for animations, utilizing GPU layer
            transform: `translateY(0px)`, 
          }}
        >
          {visibleItems.map(({ item, originalIndex }) => (
            <div key={originalIndex} style={{ height: 'auto' }}>
              {renderItem(item, originalIndex)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
