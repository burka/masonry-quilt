# masonry-quilt

A pure TypeScript masonry layout calculator — **items in, pixel positions out**.

Give it items in your preferred order, get back pixel coordinates ready to render. No DOM, no UI framework dependencies. Works anywhere JavaScript runs.

## Features

- **Order-preserving** — Items placed in your input order
- **All pixels** — Input and output in pixels, no unit conversion needed
- **Type-safe** — Generics preserve your item types
- **Zero dependencies** — Lightweight and fast

## Installation

```bash
npm install masonry-quilt
```

## Basic Usage

```typescript
import { calculateLayout } from "masonry-quilt";

const items = [
  { title: "Hero Image", color: "#e74c3c" },
  { title: "Featured Video", color: "#3498db", format: { ratio: "16:9" } },
  { title: "Portrait Photo", color: "#2ecc71", format: { ratio: "portrait" } },
  { title: "Wide Banner", color: "#9b59b6", format: { minSize: { width: 400, height: 100 } } },
  { title: "Square Thumb", color: "#f39c12", format: { size: { width: 200, height: 200 } } },
  { title: "Landscape", color: "#1abc9c", format: { ratio: "landscape" } },
  { title: "Regular Card", color: "#34495e" },
  { title: "Another Card", color: "#e67e22" },
];

const result = calculateLayout(items, 1200, 800);

// Container size
console.log(result.width, result.height);

// Each card with your original item + position
result.cards.forEach(card => {
  console.log(card.item.title, card.item.color);  // Your data
  console.log(card.x, card.y, card.width, card.height);  // Pixels
});
```

## API

### calculateLayout(items, width, height, options?)

```typescript
function calculateLayout<T extends LayoutItem>(
  items: T[],
  width: number,      // Container width (px)
  height: number,     // Container height (px)
  options?: LayoutOptions
): LayoutResult<T>;
```

The `extends LayoutItem` gives you IDE autocomplete for `format` options while preserving all your custom fields.

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `baseSize` | number | 200 | Default item size in pixels. Items without explicit size will be approximately `baseSize × baseSize`. |
| `gap` | number | 16 | Gap between items in pixels. |
| `includeGrid` | boolean | false | Include grid positioning data for CSS Grid usage. |

### Item Format

Items can have any shape. The only recognized property is `format` for layout hints:

```typescript
interface LayoutItem {
  format?: {
    size?: { width: number; height: number };     // Exact size (px)
    minSize?: { width: number; height: number };  // Minimum size (px)
    maxSize?: { width: number; height: number };  // Maximum size (px)
    ratio?: string;   // Aspect ratio: "16:9", "4:3", "portrait", "landscape", "banner", "tower"
    loose?: boolean;  // Allow ratio flexibility (default: false, shortcuts default: true)
  };
}
```

### Result

```typescript
interface LayoutResult<T> {
  cards: PlacedCard<T>[];  // Positioned items
  width: number;           // Total layout width (px)
  height: number;          // Total layout height (px)
  utilization: number;     // Space efficiency (0-1)
  orderFidelity: number;   // Order preservation (0-1, where 1 = perfect)
}

interface PlacedCard<T> {
  item: T;        // Your original item (unchanged)
  x: number;      // Left position (px)
  y: number;      // Top position (px)
  width: number;  // Width (px)
  height: number; // Height (px)
  grid?: {        // Optional grid data for CSS Grid
    col: number;      // Column start (1-based)
    row: number;      // Row start (1-based)
    colSpan: number;  // Column span
    rowSpan: number;  // Row span
  };
}
```

## Examples

### Rendering

```typescript
const result = calculateLayout(items, 1200, 800);

// Set container size
container.style.width = `${result.width}px`;
container.style.height = `${result.height}px`;
container.style.position = 'relative';

// Position each card
result.cards.forEach(card => {
  const el = document.createElement('div');
  el.style.position = 'absolute';
  el.style.left = `${card.x}px`;
  el.style.top = `${card.y}px`;
  el.style.width = `${card.width}px`;
  el.style.height = `${card.height}px`;
  el.textContent = card.item.title;
  container.appendChild(el);
});
```

### React

```tsx
// Absolute positioning
const result = calculateLayout(items, 1200, 800);

<div style={{ width: result.width, height: result.height, position: 'relative' }}>
  {result.cards.map((card, i) => (
    <div
      key={i}
      style={{
        position: 'absolute',
        left: card.x,
        top: card.y,
        width: card.width,
        height: card.height,
      }}
    >
      {card.item.title}
    </div>
  ))}
</div>

// CSS Grid (with includeGrid: true)
const result = calculateLayout(items, 1200, 800, { includeGrid: true });

<div style={{ 
  display: 'grid',
  gridTemplateColumns: `repeat(${Math.ceil(result.width / 200)}, 1fr)`,
  gridAutoRows: '200px',
  gap: '16px'
}}>
  {result.cards.map((card, i) => (
    <div
      key={i}
      style={{
        gridColumn: `${card.grid.col} / span ${card.grid.colSpan}`,
        gridRow: `${card.grid.row} / span ${card.grid.rowSpan}`,
      }}
    >
      {card.item.title}
    </div>
  ))}
</div>
```

### Canvas

```typescript
const result = calculateLayout(items, 1200, 800);

canvas.width = result.width;
canvas.height = result.height;

result.cards.forEach(card => {
  ctx.fillRect(card.x, card.y, card.width, card.height);
});
```

### Custom Item Types

Your items can have any shape — types flow through unchanged:

```typescript
interface MyCard {
  title: string;
  color: string;
  priority: number;
  onClick: () => void;
  format?: { ratio?: string; minSize?: { width: number; height: number } };
}

const items: MyCard[] = [
  { title: "Hello", color: "red", priority: 1, onClick: () => alert("hi") },
  { title: "Video", color: "blue", priority: 2, onClick: () => {}, format: { ratio: "16:9" } },
  { title: "Big", color: "green", priority: 3, onClick: () => {}, format: { minSize: { width: 400, height: 300 } } },
];

const result = calculateLayout(items, 1200, 800);

result.cards.forEach(card => {
  card.item.title;     // string
  card.item.color;     // string
  card.item.priority;  // number
  card.item.onClick;   // () => void
});
```

### Item Sizes

```typescript
const items = [
  // Default size (baseSize × baseSize)
  { title: "Normal" },

  // Exact size
  { title: "Exact", format: { size: { width: 400, height: 200 } } },

  // Minimum size
  { title: "Big", format: { minSize: { width: 400, height: 300 } } },

  // Maximum size
  { title: "Small", format: { maxSize: { width: 150, height: 150 } } },
];

const result = calculateLayout(items, 1200, 800);
```

### Aspect Ratios

```typescript
const items = [
  // Strict ratio (must match exactly)
  { title: "Video", format: { ratio: "16:9" } },

  // Flexible ratio (prefers this, but can adjust)
  { title: "Photo", format: { ratio: "4:3", loose: true } },

  // Shortcuts (implicitly loose)
  { title: "Portrait", format: { ratio: "portrait" } },   // 1:2
  { title: "Landscape", format: { ratio: "landscape" } }, // 2:1
  { title: "Banner", format: { ratio: "banner" } },       // 4:1
  { title: "Tower", format: { ratio: "tower" } },         // 1:4
];

const result = calculateLayout(items, 1200, 800);
```

### Gap and Base Size

```typescript
// Tight layout with small items
const tight = calculateLayout(items, 1200, 800, {
  baseSize: 100,
  gap: 4,
});

// Spacious layout with large items
const spacious = calculateLayout(items, 1200, 800, {
  baseSize: 300,
  gap: 24,
});
```

### CSS Grid Support

```typescript
// Get grid data for CSS Grid usage
const result = calculateLayout(items, 1200, 800, { includeGrid: true });

result.cards.forEach(card => {
  console.log(card.grid.col, card.grid.row);        // Start position (1-based)
  console.log(card.grid.colSpan, card.grid.rowSpan); // Span counts
});
```

## Helper Utilities

### ResizeObserver Helper

```typescript
import { createResizeObserver } from "masonry-quilt";

const cleanup = createResizeObserver(
  containerElement,
  (width, height) => {
    const result = calculateLayout(items, width, height);
    render(result);
  },
  150  // debounce ms
);

// Clean up when done
cleanup();
```

### Scroll Optimization Helper

```typescript
import { createScrollOptimizer } from "masonry-quilt";

const cleanup = createScrollOptimizer(
  scrollContainer,
  200,  // estimated item height
  ({ start, end }) => {
    setVisibleRange({ start, end });
  },
  100  // debounce ms
);

cleanup();
```

## How It Works

1. **Sequential placement** — Items placed in input order into shortest column
2. **Gap filling** — Unplaced items fill available gaps
3. **Expansion** — Cards scale up to fill empty space when utilization is low

## Performance

- **10,000 items in ~80ms**
- **Deterministic** — Same input always produces same output
- **No DOM** — Pure calculation, runs anywhere

## License

MIT
