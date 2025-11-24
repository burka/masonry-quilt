import type {
  LayoutItem,
  PlacedCard,
  AvailableSpace,
  LayoutResult,
  GapSize,
} from "./types";

// Gap sizes in pixels
const GAP_SIZES: Record<GapSize, number> = {
  s: 8,
  m: 16,
  l: 24,
};

// Ratio shortcuts
const RATIO_SHORTCUTS: Record<string, string> = {
  portrait: "1:2",
  landscape: "2:1",
  banner: "4:1",
  tower: "1:4",
};

/**
 * Simple hash function for deterministic variant selection
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Calculate maximum card size based on content length to avoid wasting space
 * on short notes with large blank cards.
 *
 * Content thresholds (character count) - BALANCED sizing:
 * - Tiny (0-50 chars): Max 2x1 cells (8x4 internal units)
 * - Medium (51-150 chars): Max 2x2 cells (8x8 internal units)
 * - Long (151-300 chars): Max 3x2 cells (12x8 internal units)
 * - Very long (300+ chars): No restriction
 *
 * EXCEPTION: Images, videos, PDFs, and other media notes are EXCLUDED from content caps
 *
 * @returns Max size in internal units or null for no restriction
 */
function getMaxSizeFromContent(
  item: LayoutItem,
): { width: number; height: number } | null {
  if (!item.content && !item.title) {
    return null;
  }

  const title = item.title || "";
  const content = item.content || "";
  const combinedText = title + content;

  // Detect media/spaces by type field or markdown/attachment syntax
  const isMediaType = ["image", "video", "audio", "document", "space"].includes(
    item.type || "",
  );
  const hasMediaMarkdown =
    combinedText.includes("![") ||
    combinedText.includes("[Document:") ||
    combinedText.includes("[Image:") ||
    combinedText.includes("[Video:") ||
    combinedText.includes("[Audio:");

  if (isMediaType || hasMediaMarkdown) {
    return null;
  }

  const totalChars = title.length + content.length;

  if (totalChars <= 50) {
    return { width: 8, height: 4 }; // 2x1 cells
  }

  if (totalChars <= 150) {
    return { width: 8, height: 8 }; // 2x2 cells
  }

  if (totalChars <= 300) {
    return { width: 12, height: 8 }; // 3x2 cells
  }

  return null;
}

/**
 * Calculate card size based on importance percentile (viewport-independent)
 */
function calculateCardSizeFromPercentile(
  item: LayoutItem,
  gridCols: number,
  gridRows: number,
  percentile: number,
): { width: number; height: number; contentCapped?: boolean } | null {
  // If minSize specified, respect it
  if (item.format?.minSize) {
    const minWidth = Math.round(item.format.minSize.width * 4);
    const minHeight = Math.round(item.format.minSize.height * 4);

    if (minWidth <= gridCols && minHeight <= gridRows) {
      return { width: minWidth, height: minHeight };
    }
  }

  const hash = hashString(item.id);

  // Size mapping based on percentile
  let baseSize: { width: number; height: number };

  if (percentile >= 0.9) {
    // Top 10%: Largest cards (4x4, 4x3, 3x4 cells)
    const sizes = [
      { width: 16, height: 16 },
      { width: 16, height: 12 },
      { width: 12, height: 16 },
    ];
    baseSize = sizes[hash % sizes.length];
  } else if (percentile >= 0.7) {
    // Top 30%: Large cards (3x3, 3x2, 2x3 cells)
    const sizes = [
      { width: 12, height: 12 },
      { width: 12, height: 8 },
      { width: 8, height: 12 },
    ];
    baseSize = sizes[hash % sizes.length];
  } else if (percentile >= 0.4) {
    // Top 60%: Medium cards (2x2, 2x3, 3x2 cells)
    const sizes = [
      { width: 8, height: 8 },
      { width: 8, height: 12 },
      { width: 12, height: 8 },
    ];
    baseSize = sizes[hash % sizes.length];
  } else {
    // Rest: Small cards (minimum 2x2 cells)
    baseSize = { width: 8, height: 8 };
  }

  // Apply content-based size cap
  let contentCapped = false;
  const maxSizeFromContent = getMaxSizeFromContent(item);
  if (maxSizeFromContent) {
    const originalWidth = baseSize.width;
    const originalHeight = baseSize.height;
    baseSize.width = Math.min(baseSize.width, maxSizeFromContent.width);
    baseSize.height = Math.min(baseSize.height, maxSizeFromContent.height);
    contentCapped = baseSize.width < originalWidth || baseSize.height < originalHeight;
  }

  // Enforce minimum size for spaces
  if (item.type === "space") {
    baseSize.width = Math.max(baseSize.width, 8);
    baseSize.height = Math.max(baseSize.height, 12);
  }

  // Adapt to narrow grids
  if (gridCols <= 2 && baseSize.width > gridCols) {
    const widthRatio = gridCols / baseSize.width;
    baseSize.width = gridCols;
    baseSize.height = Math.max(1, Math.round(baseSize.height * widthRatio));
  }

  // Handle format ratio constraints
  if (item.format?.ratio) {
    const ratios = Array.isArray(item.format.ratio) ? item.format.ratio : [item.format.ratio];
    const firstRatio = ratios[0];
    const resolvedRatio = RATIO_SHORTCUTS[firstRatio] || firstRatio;
    const parts = resolvedRatio.split(":");
    if (parts.length === 2) {
      const ratioW = parseInt(parts[0], 10);
      const ratioH = parseInt(parts[1], 10);
      if (!isNaN(ratioW) && !isNaN(ratioH) && ratioW > 0 && ratioH > 0) {
        const currentRatio = baseSize.width / baseSize.height;
        const targetRatio = ratioW / ratioH;

        if (Math.abs(currentRatio - targetRatio) > 0.1) {
          const area = baseSize.width * baseSize.height;
          baseSize.width = Math.round(Math.sqrt(area * targetRatio));
          baseSize.height = Math.round(baseSize.width / targetRatio);

          baseSize.width = Math.max(Math.min(2, gridCols), baseSize.width);
          baseSize.height = Math.max(Math.min(2, gridRows), baseSize.height);

          if (item.format?.strict) {
            const actualRatio = baseSize.width / baseSize.height;
            if (Math.abs(actualRatio - targetRatio) > 0.1) {
              if (ratioW > ratioH) {
                baseSize.width = Math.round((baseSize.height * ratioW) / ratioH);
              } else {
                baseSize.height = Math.round((baseSize.width * ratioH) / ratioW);
              }
            }
          }
        }
      }
    }
  }

  // Check if card fits in grid
  if (baseSize.width > gridCols || baseSize.height > gridRows) {
    if (item.format?.strict) {
      return null;
    }

    const scaleX = gridCols / baseSize.width;
    const scaleY = gridRows / baseSize.height;
    const scale = Math.min(scaleX, scaleY);

    baseSize.width = Math.max(1, Math.floor(baseSize.width * scale));
    baseSize.height = Math.max(1, Math.floor(baseSize.height * scale));

    if (baseSize.width > gridCols || baseSize.height > gridRows) {
      return null;
    }
  }

  return { ...baseSize, contentCapped };
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

/**
 * Find available spaces in grid
 */
function findAvailableSpaces(
  occupied: boolean[][],
  gridCols: number,
  gridRows: number,
): AvailableSpace[] {
  const spaces: AvailableSpace[] = [];
  const checked: boolean[][] = Array.from({ length: gridRows }, () =>
    Array(gridCols).fill(false),
  );

  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      if (!occupied[row][col] && !checked[row][col]) {
        let width = 0;
        let height = 0;

        // Measure width
        for (let c = col; c < gridCols && !occupied[row][c]; c++) {
          width++;
        }

        // Measure height
        for (let r = row; r < gridRows; r++) {
          let rowFree = true;
          for (let c = col; c < col + width; c++) {
            if (c >= gridCols || occupied[r][c]) {
              rowFree = false;
              break;
            }
          }
          if (rowFree) {
            height++;
          } else {
            break;
          }
        }

        // Mark as checked
        for (let r = row; r < row + height; r++) {
          for (let c = col; c < col + width; c++) {
            if (r < gridRows && c < gridCols) {
              checked[r][c] = true;
            }
          }
        }

        if (width > 0 && height > 0) {
          spaces.push({ width, height, row, col });
        }
      }
    }
  }

  return spaces;
}

/**
 * Calculate card layout for given items and viewport
 *
 * Uses 0.25 as base unit (4 internal units = 1 cell) for precise positioning
 *
 * @param items - Items to place in the layout
 * @param viewportWidth - Available width in pixels
 * @param viewportHeight - Available height in pixels
 * @param cellSize - Size of one cell in pixels (e.g., 200px)
 * @param gapSize - Gap between items ("s" = 8px, "m" = 16px, "l" = 24px)
 * @returns Layout result with placed cards and metadata
 */
export function calculateCardLayout(
  items: LayoutItem[],
  viewportWidth: number,
  viewportHeight: number,
  cellSize: number,
  gapSize: GapSize,
): LayoutResult {
  const gap = GAP_SIZES[gapSize];

  // Calculate grid dimensions
  const gridColsInCells = Math.floor(viewportWidth / (cellSize + gap));
  const estimatedRowsNeeded = Math.ceil((items.length * 9) / gridColsInCells);
  const viewportRowsInCells = Math.floor(viewportHeight / (cellSize + gap));
  const gridRowsInCells = Math.max(viewportRowsInCells * 3, Math.ceil(estimatedRowsNeeded * 1.5));

  // Handle unusable viewport
  if (gridColsInCells < 1 || gridRowsInCells < 1) {
    const summaryCard: PlacedCard = {
      id: "__summary__",
      width: 1,
      height: 1,
      row: 0,
      col: 0,
      importance: 0,
    };

    return {
      placed: [summaryCard],
      unplaced: items.map((item) => item.id),
      spaces: [],
      grid: { cols: Math.max(1, gridColsInCells), rows: Math.max(1, gridRowsInCells) },
      utilization: 100,
    };
  }

  // Convert to internal units (4 internal units = 1 cell)
  const gridCols = gridColsInCells * 4;
  const gridRows = gridRowsInCells * 4;

  // Use RANK-based percentiles for even distribution
  const sorted = [...items].sort((a, b) => b.importance - a.importance);
  const itemsWithPercentile = sorted.map((item, index) => ({
    ...item,
    percentile: 1 - index / Math.max(sorted.length - 1, 1),
  }));

  // SPRINKLE EFFECT: Give random 20% of low-importance cards a boost
  const [topItem, ...restItems] = itemsWithPercentile;
  const boostedItems = restItems.map((item) => {
    const hash = hashString(item.id);
    const shouldBoost = hash % 10 > 8;
    const boostedPercentile = shouldBoost ? Math.min(0.95, item.percentile + 0.3) : item.percentile;
    return { ...item, placementPercentile: boostedPercentile };
  });

  const sortedRest = boostedItems.sort((a, b) => b.placementPercentile - a.placementPercentile);
  const placementOrder = topItem ? [topItem, ...sortedRest] : sortedRest;

  // Column-based masonry algorithm
  const columnHeights: number[] = Array(gridCols).fill(0);
  const placed: PlacedCard[] = [];
  const unplaced: string[] = [];
  const occupied: boolean[][] = Array.from({ length: gridRows }, () => Array(gridCols).fill(false));

  // PHASE 1: Place each item in shortest column
  for (let i = 0; i < placementOrder.length; i++) {
    const item = placementOrder[i];
    const size = calculateCardSizeFromPercentile(item, gridCols, gridRows, item.percentile);

    if (!size) {
      unplaced.push(item.id);
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

    // Check if item fits in grid
    if (row + size.height <= gridRows) {
      placed.push({
        id: item.id,
        width: size.width,
        height: size.height,
        row: row,
        col: col,
        importance: item.importance,
        contentCapped: size.contentCapped,
      });

      // Mark cells as occupied
      for (let r = row; r < row + size.height; r++) {
        for (let c = col; c < col + size.width; c++) {
          if (r < gridRows && c < gridCols) {
            occupied[r][c] = true;
          }
        }
      }

      // Update column heights
      for (let c = bestCol; c < bestCol + size.width; c++) {
        columnHeights[c] = row + size.height;
      }
    } else {
      unplaced.push(item.id);
    }
  }

  // PHASE 2: Gap-filling
  const unplacedItems = unplaced
    .map((id) => placementOrder.find((item) => item.id === id))
    .filter((item): item is (typeof placementOrder)[0] => item !== undefined);

  unplacedItems.sort((a, b) => {
    const sizeA = calculateCardSizeFromPercentile(a, gridCols, gridRows, a.percentile);
    const sizeB = calculateCardSizeFromPercentile(b, gridCols, gridRows, b.percentile);
    if (!sizeA) return 1;
    if (!sizeB) return -1;
    return sizeA.width * sizeA.height - sizeB.width * sizeB.height;
  });

  const stillUnplaced: string[] = [];
  for (const item of unplacedItems) {
    if (item.format?.strict) {
      stillUnplaced.push(item.id);
      continue;
    }

    let size = calculateCardSizeFromPercentile(
      item,
      gridCols,
      gridRows,
      Math.max(0, item.percentile - 0.3),
    );

    let attempts = 0;
    let placedCard = false;
    while (size && attempts < 3) {
      const position = findAvailablePosition(occupied, size.width, size.height, gridCols, gridRows);

      if (position) {
        placed.push({
          id: item.id,
          width: size.width,
          height: size.height,
          row: position.row,
          col: position.col,
          importance: item.importance,
          contentCapped: size.contentCapped,
        });

        for (let r = position.row; r < position.row + size.height; r++) {
          for (let c = position.col; c < position.col + size.width; c++) {
            if (r < gridRows && c < gridCols) {
              occupied[r][c] = true;
            }
          }
        }
        placedCard = true;
        break;
      }

      attempts++;
      if (attempts === 1 && !item.format?.ratio) {
        size = { width: 4, height: 4 };
      } else if (attempts === 2 && !item.format?.ratio) {
        size = { width: 4, height: 2 };
      } else {
        break;
      }
    }

    if (!placedCard) {
      stillUnplaced.push(item.id);
    }
  }

  // Find maximum row used
  let maxRowUsed = 0;
  for (const card of placed) {
    const cardBottom = card.row + card.height;
    if (cardBottom > maxRowUsed) {
      maxRowUsed = cardBottom;
    }
  }

  const viewportRowsInUnits = viewportRowsInCells * 4;
  const actualGridRowsInUnits = Math.max(viewportRowsInUnits, maxRowUsed + 8);

  // Grow occupied array if needed
  if (actualGridRowsInUnits > gridRows) {
    const additionalRows = actualGridRowsInUnits - gridRows;
    for (let i = 0; i < additionalRows; i++) {
      occupied.push(Array(gridCols).fill(false));
    }
  }

  // Calculate utilization
  const viewportCells = gridCols * viewportRowsInUnits;
  const totalCells = gridCols * actualGridRowsInUnits;
  const usedCellsBeforeExpansion = placed.reduce((sum, card) => sum + card.width * card.height, 0);
  const utilizationBeforeExpansion = totalCells > 0 ? usedCellsBeforeExpansion / totalCells : 0;

  // PHASE 3: Proportional scaling to fill empty space
  if (utilizationBeforeExpansion < 0.75 && placed.length > 0 && totalCells > 0) {
    const targetUtilization = 0.8;
    const scaleFactor = Math.sqrt(targetUtilization / utilizationBeforeExpansion);
    const cappedScaleFactor = Math.min(scaleFactor, 2.0);
    const allowContentCappedScaling = utilizationBeforeExpansion < 0.7;

    for (const card of placed) {
      const originalItem = items.find((item) => item.id === card.id);

      if (originalItem?.format?.strict || originalItem?.format?.minSize) {
        continue;
      }

      if (card.contentCapped && !allowContentCappedScaling) {
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

  // PHASE 4: Horizontal gap-filling
  const allowContentCappedExpansion = utilizationBeforeExpansion < 0.7;

  for (const card of placed) {
    const rightCol = card.col + card.width;
    if (rightCol < gridCols) {
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
        const originalItem = items.find((item) => item.id === card.id);

        if (originalItem?.format?.strict) {
          continue;
        }

        if (card.contentCapped && !allowContentCappedExpansion) {
          continue;
        }

        for (let r = card.row; r < card.row + card.height; r++) {
          for (let c = rightCol; c < gridCols; c++) {
            occupied[r][c] = true;
          }
        }

        card.width = gridCols - card.col;
      }
    }
  }

  // Final utilization
  const finalTotalCells = gridCols * actualGridRowsInUnits;
  const usedCells = placed.reduce((sum, card) => sum + card.width * card.height, 0);
  const utilization = finalTotalCells > 0 ? Math.round((usedCells / finalTotalCells) * 100) : 0;

  const spaces: AvailableSpace[] = findAvailableSpaces(occupied, gridCols, actualGridRowsInUnits);

  return {
    placed,
    unplaced: stillUnplaced,
    spaces,
    grid: { cols: gridColsInCells, rows: Math.round(actualGridRowsInUnits / 4) },
    utilization,
  };
}
