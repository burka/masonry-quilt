import { useState, useEffect, useRef, type ReactNode, type CSSProperties } from "react";
import { calculateLayout, createResizeObserver } from "masonry-quilt";
import type { LayoutItem, PlacedCard, LayoutResult } from "masonry-quilt";
import { motion, LayoutGroup, AnimatePresence } from "framer-motion";

/** Extended layout result with calculation time */
export interface LayoutResultWithTiming<T extends LayoutItem> extends LayoutResult<T> {
  calculationTime: number;
}

export interface MasonryGridProps<T extends LayoutItem> {
  /** Items to layout */
  items: T[];
  /** Render function for each card - receives placed card data */
  children: (card: PlacedCard<T>, index: number) => ReactNode;
  /** Unique key extractor for items */
  getItemKey: (item: T) => string;
  /** Base cell size in pixels (default: 200) */
  cellSize?: number;
  /** Gap between items in pixels (default: 16) */
  gap?: number;
  /**
   * Packing strategy passed through to `calculateLayout` (default: 'grid').
   * - 'grid': cards get CSS-grid `col`/`row`/`colSpan`/`rowSpan` metadata and
   *   are rendered as CSS-grid items.
   * - 'exact': cards are placed at exact pixel positions (no `grid` field)
   *   and rendered in an absolutely-positioned layer.
   */
  packing?: "grid" | "exact";
  /** Callback when layout changes */
  onLayoutChange?: (result: LayoutResultWithTiming<T>) => void;
  /** CSS class for the container */
  className?: string;
}

/**
 * Reusable masonry grid component with Framer Motion animations.
 *
 * @example
 * ```tsx
 * <MasonryGrid items={items} getItemKey={(item) => item.id}>
 *   {(card) => (
 *     <div style={{ background: card.item.color }}>
 *       {card.item.title}
 *     </div>
 *   )}
 * </MasonryGrid>
 * ```
 */
export function MasonryGrid<T extends LayoutItem>({
  items,
  children,
  getItemKey,
  cellSize = 200,
  gap = 16,
  packing = "grid",
  onLayoutChange,
  className,
}: MasonryGridProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<PlacedCard<T>[]>([]);
  const [gridDimensions, setGridDimensions] = useState({ cols: 0, rows: 0 });
  const [resultSize, setResultSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const performLayout = (width: number, height: number) => {
      const startTime = performance.now();
      const result = calculateLayout(items, width, height, {
        baseSize: cellSize,
        gap: gap,
        // Only meaningful in 'grid' mode - 'exact' mode never returns a
        // `grid` field regardless of this flag.
        includeGrid: true,
        packing,
      });
      const endTime = performance.now();

      setLayout(result.cards);
      setResultSize({ width: result.width, height: result.height });

      const cols = Math.round(result.width / cellSize);
      const rows = Math.round(result.height / cellSize);
      setGridDimensions({ cols, rows });

      // Add calculation time to result before passing to callback
      onLayoutChange?.({ ...result, calculationTime: endTime - startTime } as LayoutResultWithTiming<T>);
    };

    // Initial calculation
    const rect = containerRef.current.getBoundingClientRect();
    performLayout(rect.width, rect.height);

    // Setup resize observer
    const cleanup = createResizeObserver(containerRef.current, performLayout, 150);

    return cleanup;
  }, [items, cellSize, gap, packing, onLayoutChange]);

  return (
    <div ref={containerRef} className={className}>
      <div
        style={
          packing === "exact"
            ? {
                position: "relative",
                // Use the packer's own reported width, not "100%": an
                // oversized item can make result.width exceed the measured
                // container width, and the relatively-positioned ancestor
                // must be at least that wide for its absolute children
                // (and any scrollbar) to be sized correctly.
                width: `${resultSize.width}px`,
                height: `${resultSize.height}px`,
              }
            : {
                display: "grid",
                gridTemplateColumns: `repeat(${gridDimensions.cols}, 1fr)`,
                gridAutoRows: `${cellSize}px`,
                gap: `${gap}px`,
              }
        }
      >
        <LayoutGroup>
          <AnimatePresence mode="popLayout">
            {layout.map((card, index) => {
              const itemStyle: CSSProperties =
                packing === "exact"
                  ? {
                      position: "absolute",
                      left: `${card.x}px`,
                      top: `${card.y}px`,
                      width: `${card.width}px`,
                      height: `${card.height}px`,
                    }
                  : {
                      gridRow: `span ${card.grid?.rowSpan ?? 1}`,
                      gridColumn: `span ${card.grid?.colSpan ?? 1}`,
                    };

              return (
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
                  style={itemStyle}
                >
                  {children(card, index)}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  );
}

export default MasonryGrid;
