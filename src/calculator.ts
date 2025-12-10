import type {
  LayoutItem,
  PlacedCard,
  LayoutResult,
  LayoutOptions,
} from "./types";

// Ratio shortcuts - these are implicitly loose (can flex the ratio if needed)
const RATIO_SHORTCUTS: Record<string, string> = {
  portrait: "1:2",
  landscape: "2:1",
  banner: "4:1",
  tower: "1:4",
};

/**
 * Calculate card size from format constraints
 * All items start at the same default size, then apply format constraints
 */
function calculateCardSize<T extends LayoutItem>(
  item: T,
  baseSize: number,
  gridCols: number,
  gridRows: number,
): { width: number; height: number } | null {
  // Start with default size (2x2 cells = 8x8 internal units)
  let width = 8;
  let height = 8;

  // If format.size is specified, use exact size (snap to grid)
  if (item.format?.size) {
    width = Math.round((item.format.size.width / baseSize) * 4);
    height = Math.round((item.format.size.height / baseSize) * 4);
  }

  // Handle format ratio constraints
  if (item.format?.ratio) {
    const ratios = Array.isArray(item.format.ratio) ? item.format.ratio : [item.format.ratio];
    const firstRatio = ratios[0];
    const resolvedRatio = RATIO_SHORTCUTS[firstRatio] || firstRatio;
    const isLoose = RATIO_SHORTCUTS[firstRatio] !== undefined || item.format.loose === true;

    const parts = resolvedRatio.split(":");
    if (parts.length === 2) {
      const ratioW = parseInt(parts[0], 10);
      const ratioH = parseInt(parts[1], 10);
      if (!Number.isNaN(ratioW) && !Number.isNaN(ratioH) && ratioW > 0 && ratioH > 0) {
        const currentRatio = width / height;
        const targetRatio = ratioW / ratioH;

        if (Math.abs(currentRatio - targetRatio) > 0.1) {
          const area = width * height;
          width = Math.round(Math.sqrt(area * targetRatio));
          height = Math.round(width / targetRatio);

          width = Math.max(Math.min(2, gridCols), width);
          height = Math.max(Math.min(2, gridRows), height);

          if (!isLoose) {
            const actualRatio = width / height;
            if (Math.abs(actualRatio - targetRatio) > 0.1) {
              if (ratioW > ratioH) {
                width = Math.round((height * ratioW) / ratioH);
              } else {
                height = Math.round((width * ratioH) / ratioW);
              }
            }
          }
        }
      }
    }
  }

  // Apply minSize constraint
  if (item.format?.minSize) {
    const minWidth = Math.round((item.format.minSize.width / baseSize) * 4);
    const minHeight = Math.round((item.format.minSize.height / baseSize) * 4);
    width = Math.max(width, minWidth);
    height = Math.max(height, minHeight);
  }

  // Apply maxSize constraint
  if (item.format?.maxSize) {
    const maxWidth = Math.round((item.format.maxSize.width / baseSize) * 4);
    const maxHeight = Math.round((item.format.maxSize.height / baseSize) * 4);
    width = Math.min(width, maxWidth);
    height = Math.min(height, maxHeight);
  }

  // Check if card fits in grid
  if (width > gridCols || height > gridRows) {
    // If loose ratio, scale down to fit
    if (item.format?.loose !== false && (!item.format?.ratio || RATIO_SHORTCUTS[item.format.ratio as string])) {
      const scaleX = gridCols / width;
      const scaleY = gridRows / height;
      const scale = Math.min(scaleX, scaleY);

      width = Math.max(1, Math.floor(width * scale));
      height = Math.max(1, Math.floor(height * scale));

      if (width > gridCols || height > gridRows) {
        return null;
      }
    } else {
      return null;
    }
  }

  return { width, height };
}

/**
 * Find first available position for card of given size
 */
function findAvailablePosition(
  occupied: boolean[][],
  width: number,
  height: number,
  gridCols: number,
  gridRows: number,
): { row: number; col: number } | null {
  for (let row = 0; row <= gridRows - height; row++) {
    for (let col = 0; col <= gridCols - width; col++) {
      let fits = true;
      for (let r = row; r < row + height && fits; r++) {
        for (let c = col; c < col + width && fits; c++) {
          if (r >= gridRows || c >= gridCols || occupied[r][c]) {
            fits = false;
          }
        }
      }

      if (fits) {
        return { row, col };
      }
    }
  }

  return null;
}

/** Item wrapper for tracking original index without modifying item */
interface IndexedItem<T> {
  item: T;
  originalIndex: number;
}

/** Internal placed card structure */
interface InternalPlacedCard<T> {
  item: T;
  originalIndex: number;
  width: number;
  height: number;
  row: number;
  col: number;
}

/** Shared context for layout phases */
interface LayoutContext<T> {
  gridCols: number;
  gridRows: number;
  occupied: boolean[][];
  placed: InternalPlacedCard<T>[];
}

/**
 * Check if a card can be scaled/expanded
 */
function canModifyCard<T extends LayoutItem>(
  card: InternalPlacedCard<T>,
  originalItem: T,
): boolean {
  if (originalItem.format?.loose === false) return false;
  if (originalItem.format?.size) return false; // Explicit size should not be modified
  if (originalItem.format?.minSize) return false;
  if (originalItem.format?.maxSize) return false;
  if (originalItem.format?.ratio) return false; // Ratio should not be modified after calculation
  return true;
}

/**
 * Mark a rectangular region in a 2D boolean grid
 */
function markRegion(
  grid: boolean[][],
  row: number,
  col: number,
  width: number,
  height: number,
  maxRows: number,
  maxCols: number,
): void {
  for (let r = row; r < row + height; r++) {
    for (let c = col; c < col + width; c++) {
      if (r < maxRows && c < maxCols) {
        grid[r][c] = true;
      }
    }
  }
}

/**
 * PHASE 1: Place each item in shortest column using masonry algorithm
 * Items can only move ±maxDisplacement positions from their original order
 */
function placeItemsInColumns<T extends LayoutItem>(
  indexedItems: IndexedItem<T>[],
  ctx: LayoutContext<T>,
  baseSize: number,
  maxDisplacement: number,
): number[] {
  const { gridCols, gridRows, occupied, placed } = ctx;
  const columnHeights: number[] = Array(gridCols).fill(0);
  const unplacedIndices: number[] = [];

  for (let i = 0; i < indexedItems.length; i++) {
    const { item, originalIndex } = indexedItems[i];
    const size = calculateCardSize(item, baseSize, gridCols, gridRows);

    if (!size) {
      unplacedIndices.push(i);
      continue;
    }

    // Find shortest contiguous span of columns
    let bestCol = 0;
    let minHeight = Infinity;

    for (let col = 0; col <= gridCols - size.width; col++) {
      let maxHeightInSpan = 0;
      for (let c = col; c < col + size.width; c++) {
        maxHeightInSpan = Math.max(maxHeightInSpan, columnHeights[c]);
      }

      if (maxHeightInSpan < minHeight) {
        minHeight = maxHeightInSpan;
        bestCol = col;
      }
    }

    const col = bestCol;
    const row = minHeight;

    if (row + size.height <= gridRows) {
      placed.push({
        item,
        originalIndex,
        width: size.width,
        height: size.height,
        row,
        col,
      });

      markRegion(occupied, row, col, size.width, size.height, gridRows, gridCols);

      for (let c = bestCol; c < bestCol + size.width; c++) {
        columnHeights[c] = row + size.height;
      }
    } else {
      unplacedIndices.push(i);
    }
  }

  return unplacedIndices;
}

/**
 * PHASE 2: Try to place unplaced items in available gaps
 * Respects looseness constraint - items can only move ±maxDisplacement positions
 */
function fillGaps<T extends LayoutItem>(
  indexedItems: IndexedItem<T>[],
  unplacedIndices: number[],
  ctx: LayoutContext<T>,
  baseSize: number,
  maxDisplacement: number,
): void {
  const { gridCols, gridRows, occupied, placed } = ctx;

  const unplacedItems = unplacedIndices.map(i => indexedItems[i]);

  // Sort by size (smaller first) to fit into gaps
  unplacedItems.sort((a, b) => {
    const sizeA = calculateCardSize(a.item, baseSize, gridCols, gridRows);
    const sizeB = calculateCardSize(b.item, baseSize, gridCols, gridRows);
    if (!sizeA) return 1;
    if (!sizeB) return -1;
    return sizeA.width * sizeA.height - sizeB.width * sizeB.height;
  });

  for (const { item, originalIndex } of unplacedItems) {
    let size = calculateCardSize(item, baseSize, gridCols, gridRows);
    let attempts = 0;
    let placedCard = false;

    while (size && attempts < 3) {
      const position = findAvailablePosition(occupied, size.width, size.height, gridCols, gridRows);

      if (position) {
        placed.push({
          item,
          originalIndex,
          width: size.width,
          height: size.height,
          row: position.row,
          col: position.col,
        });

        markRegion(occupied, position.row, position.col, size.width, size.height, gridRows, gridCols);
        placedCard = true;
        break;
      }

      attempts++;
      // Try smaller sizes if loose
      if (attempts === 1 && item.format?.loose !== false && !item.format?.ratio) {
        size = { width: 4, height: 4 };
      } else if (attempts === 2 && item.format?.loose !== false && !item.format?.ratio) {
        size = { width: 4, height: 2 };
      } else {
        break;
      }
    }

    // If still not placed, grow grid and place it
    if (!placedCard && size) {
      // Find a position at the bottom of the grid
      const col = 0;
      const row = gridRows;

      // Grow the grid
      const additionalRows = size.height + 8; // Add some padding
      for (let i = 0; i < additionalRows; i++) {
        occupied.push(Array(gridCols).fill(false));
      }
      ctx.gridRows += additionalRows;

      placed.push({
        item,
        originalIndex,
        width: size.width,
        height: size.height,
        row,
        col,
      });

      markRegion(occupied, row, col, size.width, size.height, ctx.gridRows, gridCols);
    }
  }
}

/**
 * PHASE 3: Scale cards proportionally when utilization is low
 */
function scaleCards<T extends LayoutItem>(
  ctx: LayoutContext<T>,
  utilizationBeforeExpansion: number,
  actualGridRowsInUnits: number,
): void {
  const { gridCols, placed } = ctx;

  if (utilizationBeforeExpansion >= 0.75 || placed.length === 0) {
    return;
  }

  const targetUtilization = 0.8;
  const scaleFactor = Math.sqrt(targetUtilization / utilizationBeforeExpansion);
  const cappedScaleFactor = Math.min(scaleFactor, 2.0);

  for (const card of placed) {
    if (!canModifyCard(card, card.item)) {
      continue;
    }

    const newWidth = Math.max(2, Math.round(card.width * cappedScaleFactor));
    const newHeight = Math.max(2, Math.round(card.height * cappedScaleFactor));

    if (newWidth <= gridCols && newHeight <= actualGridRowsInUnits) {
      card.width = newWidth;
      card.height = newHeight;
    }
  }
}

/**
 * PHASE 4: Expand cards horizontally to fill remaining gaps
 */
function expandHorizontally<T extends LayoutItem>(
  ctx: LayoutContext<T>,
  utilizationBeforeExpansion: number,
  actualGridRowsInUnits: number,
): void {
  const { gridCols, occupied, placed } = ctx;

  for (const card of placed) {
    const rightCol = card.col + card.width;
    if (rightCol >= gridCols) continue;

    let canExpandRight = true;
    for (let r = card.row; r < card.row + card.height; r++) {
      for (let c = rightCol; c < gridCols; c++) {
        if (r >= actualGridRowsInUnits || occupied[r][c]) {
          canExpandRight = false;
          break;
        }
      }
      if (!canExpandRight) break;
    }

    if (canExpandRight) {
      if (!canModifyCard(card, card.item)) {
        continue;
      }

      const expandWidth = gridCols - rightCol;
      markRegion(occupied, card.row, rightCol, expandWidth, card.height, actualGridRowsInUnits, gridCols);
      card.width = gridCols - card.col;
    }
  }
}

/**
 * Calculate card layout for given items
 *
 * Uses 0.25 as base unit (4 internal units = 1 cell) for precise positioning
 *
 * @param items - Items to place in the layout
 * @param width - Container width in pixels
 * @param height - Container height in pixels
 * @param options - Optional layout configuration
 * @returns Layout result with placed cards and metadata
 */
export function calculateLayout<T extends LayoutItem>(
  items: T[],
  width: number,
  height: number,
  options?: LayoutOptions,
): LayoutResult<T> {
  const baseSize = options?.baseSize ?? 200;
  const gap = options?.gap ?? 16;
  const looseness = options?.looseness ?? 0.2;
  const includeGrid = options?.includeGrid ?? false;

  // Wrap items with original index for displacement tracking (preserves original reference)
  const indexedItems: IndexedItem<T>[] = items.map((item, index) => ({
    item,
    originalIndex: index,
  }));

  // Calculate grid dimensions
  const gridColsInCells = Math.floor(width / (baseSize + gap));
  const estimatedRowsNeeded = Math.ceil((items.length * 9) / gridColsInCells);
  const viewportRowsInCells = Math.floor(height / (baseSize + gap));
  const gridRowsInCells = Math.max(viewportRowsInCells * 3, Math.ceil(estimatedRowsNeeded * 1.5));

  // Handle unusable viewport
  if (gridColsInCells < 1 || gridRowsInCells < 1) {
    return {
      cards: [],
      width: Math.max(baseSize, width),
      height: Math.max(baseSize, height),
      utilization: 0,
      orderFidelity: 1,
    };
  }

  // Convert to internal units (4 internal units = 1 cell)
  const gridCols = gridColsInCells * 4;
  const gridRows = gridRowsInCells * 4;

  // Calculate maximum displacement based on looseness
  const maxDisplacement = Math.floor(looseness * items.length);

  // Initialize layout context
  const placed: InternalPlacedCard<T>[] = [];
  const occupied: boolean[][] = Array.from({ length: gridRows }, () => Array(gridCols).fill(false));
  const ctx: LayoutContext<T> = { gridCols, gridRows, occupied, placed };

  // PHASE 1: Place items in columns
  const unplacedIndices = placeItemsInColumns(indexedItems, ctx, baseSize, maxDisplacement);

  // PHASE 2: Fill gaps with unplaced items (grows grid if needed)
  fillGaps(indexedItems, unplacedIndices, ctx, baseSize, maxDisplacement);

  // Calculate actual grid height and utilization
  const maxRowUsed = placed.reduce((max, card) => Math.max(max, card.row + card.height), 0);
  const viewportRowsInUnits = viewportRowsInCells * 4;
  const actualGridRowsInUnits = Math.max(viewportRowsInUnits, maxRowUsed + 8);

  // Grow occupied array if needed
  if (actualGridRowsInUnits > ctx.gridRows) {
    const additionalRows = actualGridRowsInUnits - ctx.gridRows;
    for (let i = 0; i < additionalRows; i++) {
      occupied.push(Array(gridCols).fill(false));
    }
    ctx.gridRows = actualGridRowsInUnits;
  }

  const totalCells = gridCols * actualGridRowsInUnits;
  const usedCellsBeforeExpansion = placed.reduce((sum, card) => sum + card.width * card.height, 0);
  const utilizationBeforeExpansion = totalCells > 0 ? usedCellsBeforeExpansion / totalCells : 0;

  // PHASE 3: Scale cards proportionally
  scaleCards(ctx, utilizationBeforeExpansion, actualGridRowsInUnits);

  // PHASE 4: Expand cards horizontally
  expandHorizontally(ctx, utilizationBeforeExpansion, actualGridRowsInUnits);

  // Calculate final utilization
  const finalTotalCells = gridCols * actualGridRowsInUnits;
  const usedCells = placed.reduce((sum, card) => sum + card.width * card.height, 0);
  const utilization = finalTotalCells > 0 ? (usedCells / finalTotalCells) : 0;

  // Calculate order fidelity
  let maxActualDisplacement = 0;
  const sortedPlaced = [...placed].sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row;
    return a.col - b.col;
  });

  for (let placementIndex = 0; placementIndex < sortedPlaced.length; placementIndex++) {
    const card = sortedPlaced[placementIndex];
    const displacement = Math.abs(placementIndex - card.originalIndex);
    maxActualDisplacement = Math.max(maxActualDisplacement, displacement);
  }

  const orderFidelity = items.length > 0 ? 1 - (maxActualDisplacement / items.length) : 1;

  // Convert internal units to pixels
  const cards: PlacedCard<T>[] = placed.map(card => {
    const placedCard: PlacedCard<T> = {
      item: card.item,
      x: (card.col * (baseSize + gap)) / 4,
      y: (card.row * (baseSize + gap)) / 4,
      width: (card.width * baseSize) / 4,
      height: (card.height * baseSize) / 4,
    };

    // Add grid data for CSS Grid usage if requested
    if (includeGrid) {
      placedCard.grid = {
        col: Math.floor(card.col / 4) + 1, // 1-based for CSS Grid
        row: Math.floor(card.row / 4) + 1, // 1-based for CSS Grid
        colSpan: Math.ceil(card.width / 4),
        rowSpan: Math.ceil(card.height / 4),
      };
    }

    return placedCard;
  });

  // Calculate actual output dimensions in pixels
  const maxX = cards.reduce((max, card) => Math.max(max, card.x + card.width), 0);
  const maxY = cards.reduce((max, card) => Math.max(max, card.y + card.height), 0);

  return {
    cards,
    width: Math.max(width, maxX),
    height: Math.max(height, maxY),
    utilization,
    orderFidelity,
  };
}
