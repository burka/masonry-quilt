/**
 * masonry-quilt - Pure TypeScript masonry layout calculator
 *
 * Packs boxes into a given space with importance-based sizing.
 * No UI dependencies - just boxes in, positioning out.
 *
 * @packageDocumentation
 */

export { calculateCardLayout } from "./calculator";
export type {
  LayoutItem,
  PlacedCard,
  AvailableSpace,
  LayoutResult,
  GapSize,
  LayoutOptions,
} from "./types";
export { createResizeObserver, createScrollOptimizer } from "./helpers";
