import { useState, useEffect, useRef, type ReactNode } from "react";
import { calculateLayout, createResizeObserver } from "masonry-quilt";
import type { LayoutItem, PlacedCard, LayoutResult } from "masonry-quilt";
import { motion, LayoutGroup, AnimatePresence } from "framer-motion";

export interface MasonryGridProps<T extends LayoutItem> {
  /** Items to layout */
  items: T[];
  /** Base cell size in pixels (default: 200) */
  cellSize?: number;
  /** Gap between items in pixels (default: 16) */
  gap?: number;
  /** Render function for each card */
  renderCard: (card: PlacedCard<T>, index: number) => ReactNode;
  /** Unique key extractor for items */
  getItemKey: (item: T) => string;
  /** Callback when layout changes */
  onLayoutChange?: (result: LayoutResult<T>) => void;
  /** CSS class for the container */
  className?: string;
}

export interface MasonryGridStats {
  cols: number;
  rows: number;
  utilization: number;
  orderFidelity: number;
  calculationTime: number;
  cardCount: number;
}

/**
 * Reusable masonry grid component with Framer Motion animations
 */
export function MasonryGrid<T extends LayoutItem>({
  items,
  cellSize = 200,
  gap = 16,
  renderCard,
  getItemKey,
  onLayoutChange,
  className,
}: MasonryGridProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<PlacedCard<T>[]>([]);
  const [gridDimensions, setGridDimensions] = useState({ cols: 0, rows: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const performLayout = (width: number, height: number) => {
      const result = calculateLayout(items, width, height, {
        baseSize: cellSize,
        gap: gap,
        includeGrid: true,
      });

      setLayout(result.cards);

      const cols = Math.round(result.width / cellSize);
      const rows = Math.round(result.height / cellSize);
      setGridDimensions({ cols, rows });

      onLayoutChange?.(result);
    };

    // Initial calculation
    const rect = containerRef.current.getBoundingClientRect();
    performLayout(rect.width, rect.height);

    // Setup resize observer
    const cleanup = createResizeObserver(containerRef.current, performLayout, 150);

    return cleanup;
  }, [items, cellSize, gap, onLayoutChange]);

  return (
    <div ref={containerRef} className={className}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${gridDimensions.cols}, 1fr)`,
          gridAutoRows: `${cellSize}px`,
          gap: `${gap}px`,
        }}
      >
        <LayoutGroup>
          <AnimatePresence mode="popLayout">
            {layout.map((card, index) => (
              <motion.div
                key={getItemKey(card.item)}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{
                  layout: { type: "spring", stiffness: 250, damping: 20 },
                  opacity: { duration: 0.3 },
                  scale: { duration: 0.3 },
                }}
                style={{
                  gridRow: `span ${card.grid!.rowSpan}`,
                  gridColumn: `span ${card.grid!.colSpan}`,
                }}
              >
                {renderCard(card, index)}
              </motion.div>
            ))}
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  );
}

export default MasonryGrid;
