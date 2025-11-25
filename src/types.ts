/**
 * Item to be placed in the masonry layout
 */
export interface LayoutItem {
  /** Unique identifier for the item */
  id: string;
  /** Importance score (0-10 scale), affects size and placement priority */
  importance: number;
  /** Optional content for size calculation */
  content?: string;
  /** Optional title for size calculation */
  title?: string;
  /** Optional type (e.g., "image", "video", "audio", "document") for media detection */
  type?: string;
  /** Optional format constraints */
  format?: {
    /** Aspect ratio: '1:1' | ['16:9', '4:3'] | 'banner' | 'tower' | 'portrait' | 'landscape' */
    ratio?: string | string[];
    /** If true, must match ratio exactly; if false, ratio is a hint */
    strict?: boolean;
    /** Minimum size in cells, e.g., {width: 1, height: 0.25} */
    minSize?: { width: number; height: number };
  };
}

/**
 * Placed card with position and dimensions
 */
export interface PlacedCard {
  /** Item identifier */
  id: string;
  /** Width in internal units (0.25 cell granularity) */
  width: number;
  /** Height in internal units */
  height: number;
  /** Row position in internal units */
  row: number;
  /** Column position in internal units */
  col: number;
  /** Importance score (0-10 scale) */
  importance: number;
  /** True if size was limited by content length */
  contentCapped?: boolean;
}

/**
 * Available space in the grid
 */
export interface AvailableSpace {
  /** Width in internal units */
  width: number;
  /** Height in internal units */
  height: number;
  /** Row position in internal units */
  row: number;
  /** Column position in internal units */
  col: number;
}

/**
 * Layout calculation result
 */
export interface LayoutResult {
  /** Successfully placed cards */
  placed: PlacedCard[];
  /** IDs of items that couldn't fit */
  unplaced: string[];
  /** Remaining available spaces */
  spaces: AvailableSpace[];
  /** Grid dimensions in cells (not internal units) */
  grid: {
    /** Number of columns in cells */
    cols: number;
    /** Number of rows in cells */
    rows: number;
  };
  /** Space utilization percentage (0-100) */
  utilization: number;
}

/**
 * Gap size options
 */
export type GapSize = "s" | "m" | "l";

/**
 * Layout options for fine-tuning the masonry algorithm
 */
export interface LayoutOptions {
  /**
   * Sprinkle effect configuration - randomly boosts some low-importance cards
   * for visual variety. Set to false to disable, or configure the boost behavior.
   *
   * @default { enabled: true, percentage: 0.2, boost: 0.3 }
   */
  sprinkle?:
    | boolean
    | {
        /** Enable/disable the sprinkle effect */
        enabled: boolean;
        /** Percentage of cards to boost (0-1 range, e.g., 0.2 = 20%) */
        percentage?: number;
        /** Amount to boost percentile by (0-1 range, e.g., 0.3 = 30% boost) */
        boost?: number;
      };
}
