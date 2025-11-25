# masonry-quilt

A pure TypeScript masonry layout calculator that packs boxes into a given space - **no UI, just boxes in and positioning out**.

This library provides a sophisticated masonry layout algorithm with importance-based sizing, content-aware optimization, and flexible formatting options. Perfect for building card-based UIs, galleries, dashboards, or any layout where you need intelligent box packing.

## Features

- **Pure calculation** - No UI dependencies, works anywhere JavaScript runs
- **Importance-based sizing** - Higher importance items get more prominent placement and larger sizes
- **Content-aware** - Automatically adjusts card sizes based on content length to avoid large empty spaces
- **Flexible formatting** - Support for aspect ratios, minimum sizes, and strict constraints
- **Efficient packing** - Column-based masonry algorithm with gap-filling and space optimization
- **TypeScript native** - Fully typed with comprehensive type definitions
- **Zero dependencies** - Lightweight and fast
- **Optional helpers** - ResizeObserver and scroll optimization utilities included

## Installation

```bash
npm install masonry-quilt
```

## Live Example

Check out the [React example](./example-react/) with colorful cards and big fonts to see the library in action!

```bash
cd example-react
npm install
npm run dev
```

## Basic Usage

```typescript
import { calculateCardLayout } from "masonry-quilt";

const items = [
  { id: "1", importance: 10 }, // Most important
  { id: "2", importance: 5 },
  { id: "3", importance: 2 },
  { id: "4", importance: 1 },
];

const result = calculateCardLayout(
  items,
  1920, // viewport width
  1080, // viewport height
  200, // cell size in pixels
  "m", // gap size: "s" | "m" | "l"
);

console.log(result.placed); // Array of positioned cards with dimensions
console.log(result.utilization); // Space utilization percentage
```

## API

### calculateCardLayout(items, viewportWidth, viewportHeight, cellSize, gapSize, options?)

Calculate masonry layout for given items and viewport.

**Parameters:**

- `items: LayoutItem[]` - Items to place in the layout
- `viewportWidth: number` - Available width in pixels
- `viewportHeight: number` - Available height in pixels
- `cellSize: number` - Size of one cell in pixels (e.g., 200px means 2x2 card = 400px)
- `gapSize: "s" | "m" | "l"` - Gap between items (s=8px, m=16px, l=24px)
- `options?: LayoutOptions` - Optional layout configuration

**Returns:** `LayoutResult`

```typescript
interface LayoutResult {
  placed: PlacedCard[]; // Successfully placed cards
  unplaced: string[]; // IDs of items that couldn't fit
  spaces: AvailableSpace[]; // Remaining available spaces
  grid: { cols: number; rows: number }; // Grid dimensions
  utilization: number; // Space utilization percentage (0-100)
}
```

### LayoutItem Interface

```typescript
interface LayoutItem {
  id: string; // Unique identifier
  importance: number; // 0-10 scale, affects size and priority
  content?: string; // Optional content for size calculation
  title?: string; // Optional title for size calculation
  type?: string; // Optional type: "image" | "video" | "audio" | "document"
  format?: {
    ratio?: string | string[]; // Aspect ratio: "1:1" | "16:9" | "portrait" | "landscape" | "banner" | "tower"
    strict?: boolean; // If true, must match ratio exactly
    minSize?: { width: number; height: number }; // Minimum size in cells
  };
}
```

### PlacedCard Interface

```typescript
interface PlacedCard {
  id: string; // Item identifier
  width: number; // Width in internal units (4 units = 1 cell)
  height: number; // Height in internal units
  row: number; // Row position in internal units
  col: number; // Column position in internal units
  importance: number; // Original importance score
  contentCapped?: boolean; // True if size was limited by content length
}
```

## Advanced Examples

### Configuring the Sprinkle Effect

By default, the library uses a "sprinkle effect" that randomly boosts ~20% of lower-importance cards for visual variety. You can configure or disable this:

```typescript
// Disable sprinkle effect completely (strict importance ordering)
const result = calculateCardLayout(items, 1920, 1080, 200, "m", {
  sprinkle: false,
});

// Enable with default settings (20% boost by 0.3)
const result = calculateCardLayout(items, 1920, 1080, 200, "m", {
  sprinkle: true,
});

// Custom configuration
const result = calculateCardLayout(items, 1920, 1080, 200, "m", {
  sprinkle: {
    enabled: true,
    percentage: 0.3, // 30% of cards get boosted
    boost: 0.4, // Boost percentile by 0.4 (40%)
  },
});
```

**When to disable:**
- When you need strict importance-based ordering
- For predictable, non-randomized layouts
- When building galleries with exact order requirements

**When to enable:**
- For visually interesting, varied layouts (default)
- To prevent monotonous size patterns
- When order flexibility is acceptable

### Content-Aware Sizing

```typescript
const items = [
  {
    id: "short-note",
    importance: 10,
    content: "Buy milk", // Short content gets smaller card despite high importance
  },
  {
    id: "long-article",
    importance: 5,
    content: "Lorem ipsum...".repeat(100), // Long content gets appropriate space
  },
  {
    id: "image-note",
    importance: 5,
    type: "image",
    content: "Short", // Images bypass content caps
  },
];

const result = calculateCardLayout(items, 1920, 1080, 200, "m");
```

### Aspect Ratio Constraints

```typescript
const items = [
  {
    id: "video",
    importance: 8,
    format: {
      ratio: "16:9",
      strict: true, // Must maintain exact ratio
    },
  },
  {
    id: "portrait",
    importance: 6,
    format: {
      ratio: "portrait", // Shortcut for 1:2
      strict: false, // Hint, not strict requirement
    },
  },
];

const result = calculateCardLayout(items, 1920, 1080, 200, "m");
```

### Minimum Size Requirements

```typescript
const items = [
  {
    id: "banner",
    importance: 3,
    format: {
      minSize: { width: 4, height: 1 }, // Minimum 4x1 cells
      ratio: "banner", // 4:1 ratio
      strict: true,
    },
  },
];

const result = calculateCardLayout(items, 1920, 1080, 200, "m");
```

## Helper Utilities

### ResizeObserver Helper

```typescript
import { createResizeObserver } from "masonry-quilt";

const cleanup = createResizeObserver(
  containerElement,
  (width, height) => {
    const result = calculateCardLayout(items, width, height, 200, "m");
    updateUI(result.placed);
  },
  150, // debounce delay
);

// Later, clean up
cleanup();
```

### Scroll Optimization Helper

```typescript
import { createScrollOptimizer } from "masonry-quilt";

const cleanup = createScrollOptimizer(
  scrollContainer,
  200, // estimated item height
  ({ start, end }) => {
    // Only render items from index start to end
    setVisibleRange({ start, end });
  },
  100, // debounce delay
);

// Later, clean up
cleanup();
```

## How It Works

1. **Importance-based percentile ranking** - Items are ranked by importance, creating an even distribution across size buckets regardless of absolute scores

2. **Column-based masonry placement** - Each item is placed in the shortest available column span, creating a balanced layout

3. **Gap-filling optimization** - Smaller items are intelligently placed in remaining gaps

4. **Proportional scaling** - When space utilization is low (<75%), cards are scaled up to fill empty space

5. **Horizontal expansion** - Cards expand horizontally to eliminate vertical strips of wasted space

6. **Content-aware capping** - Short text content prevents unnecessarily large cards, improving density

## Internal Coordinate System

The library uses a precise internal coordinate system with 0.25 cell granularity (4 internal units = 1 cell). This allows for:

- Sub-cell positioning precision
- Smooth aspect ratio handling
- Efficient space utilization
- Flexible card sizing

When you receive `PlacedCard` results, you can convert internal units to cells by dividing by 4:

```typescript
const cellWidth = placedCard.width / 4;
const cellHeight = placedCard.height / 4;
```

## Performance

- Handles hundreds of items efficiently
- Deterministic output - same input always produces same layout
- No DOM dependencies - runs in Node.js or browser
- Optimized algorithms with O(n log n) complexity
- Optional helpers for UI integration (debouncing, virtualization)

## License

MIT

## Contributing

Contributions welcome! This library was extracted from the [mdnotes](https://github.com/yourusername/mdnotes) project's masonry layout implementation.
