/**
 * Item to be placed in the masonry layout.
 * Can have any additional fields - only `format` is read by the algorithm.
 */
export interface LayoutItem {
  format?: {
    /** Exact size in pixels */
    size?: { width: number; height: number };
    /** Minimum size in pixels */
    minSize?: { width: number; height: number };
    /** Maximum size in pixels */
    maxSize?: { width: number; height: number };
    /** Aspect ratio: "16:9", "4:3", "portrait", "landscape", "banner", "tower" */
    ratio?: string;
    /** Allow ratio flexibility (default: false, shortcuts default: true) */
    loose?: boolean;
  };
}

/**
 * Placed card with position and dimensions in pixels.
 */
export interface PlacedCard<T> {
  /** Original input item preserved unchanged */
  item: T;
  /** Left position in pixels */
  x: number;
  /** Top position in pixels */
  y: number;
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
  /** Optional grid positioning for CSS Grid usage */
  grid?: {
    /** Column start position (1-based) */
    col: number;
    /** Row start position (1-based) */
    row: number;
    /** Column span count */
    colSpan: number;
    /** Row span count */
    rowSpan: number;
  };
}

/**
 * Layout calculation result.
 */
export interface LayoutResult<T> {
  /** Positioned items */
  cards: PlacedCard<T>[];
  /** Total layout width in pixels */
  width: number;
  /** Total layout height in pixels */
  height: number;
  /** Space efficiency (0-1) */
  utilization: number;
  /** Order preservation (0-1, where 1 = perfect) */
  orderFidelity: number;
}

/**
 * Layout options for fine-tuning the masonry algorithm.
 */
export interface LayoutOptions {
  /** Default item size in pixels (default: 200) */
  baseSize?: number;
  /** Gap between items in pixels (default: 16) */
  gap?: number;
  /** Order flexibility 0-1 (default: 0.2). 0=strict order, 1=any movement allowed */
  looseness?: number;
  /** Include grid positioning data for CSS Grid usage (default: false) */
  includeGrid?: boolean;
}
