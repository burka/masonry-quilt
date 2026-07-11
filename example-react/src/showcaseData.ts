import type { ShowcaseCard, DemoItemCard as DemoItemCardType } from './cards/types';

// Quick start code snippet
const QUICK_START_CODE = `npm install masonry-quilt

import { calculateLayout } from "masonry-quilt";

const result = calculateLayout(items, width, height);
// result.cards[].x, .y, .width, .height

// Pixel-exact skyline packing:
calculateLayout(items, width, height, { packing: "exact" });
// no quantization; honors format.size / format.variants`;

// Grid footprint ([cols, rows]) implied by each supported ratio shortcut -
// used only to translate 'grid' mode's implicit cell spans into real pixel
// dimensions when the viewer switches to 'exact' packing mode.
const RATIO_SPAN: Record<string, [number, number]> = {
  '1:1': [1, 1],
  landscape: [2, 1],
  '16:9': [2, 1],
  '4:3': [2, 1],
  '3:2': [2, 1],
  portrait: [1, 2],
  banner: [4, 1],
  '4:1': [4, 1],
  tower: [1, 4],
  '1:4': [1, 4],
};

function spanToPixels(cols: number, rows: number, cellSize: number, gap: number) {
  return {
    width: cols * cellSize + (cols - 1) * gap,
    height: rows * cellSize + (rows - 1) * gap,
  };
}

/**
 * Translate each item's grid-oriented hints (`format.ratio`, `variantSpans`)
 * into the pixel-exact `format.size` / `format.variants` that 'exact' mode
 * reads, at the current cellSize/gap. Items without a recognized ratio or
 * variantSpans are returned unchanged (exact mode falls back to a baseSize
 * square for those, which is exactly what a plain demo item should get).
 */
export function toExactModeItems<T extends { format?: ShowcaseCard['format']; variantSpans?: [number, number][] }>(
  items: T[],
  cellSize: number,
  gap: number,
): T[] {
  return items.map((item) => {
    if (item.variantSpans && item.variantSpans.length > 0) {
      const variants = item.variantSpans.map(([cols, rows]) => spanToPixels(cols, rows, cellSize, gap));
      return { ...item, format: { ...item.format, variants } };
    }

    const ratio = item.format?.ratio;
    const span = ratio ? RATIO_SPAN[ratio as string] : undefined;
    if (!span) return item;

    const size = spanToPixels(span[0], span[1], cellSize, gap);
    return { ...item, format: { ...item.format, size } };
  });
}

// Available aspect ratios for filtering
export const AVAILABLE_RATIOS = [
  'landscape', '16:9', '4:3', '1:1', '3:2', 'portrait', 'banner', 'tower'
];

// Generate demo items (the colorful emoji cards)
const emojis = [
  '🎯', '🔥', '⭐', '📸', '🎬', '💡', '📝', '✅', '📋', '🗒️',
  '🎨', '📱', '🌟', '🎵', '📄', '🚀', '📊', '🎮', '💬', '🏷️',
];

const colors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B195', '#C06C84',
  '#E74C3C', '#3498DB', '#2ECC71', '#9B59B6', '#1ABC9C',
  '#E67E22', '#34495E', '#16A085', '#D35400', '#8E44AD',
];

const ratios: (DemoItemCardType['format'] | undefined)[] = [
  undefined,
  { ratio: 'landscape' },
  { ratio: '16:9' },
  { ratio: '4:3' },
  { ratio: '1:1' },
  { ratio: '3:2' },
  { ratio: 'portrait' },
  { ratio: 'banner' },
  { ratio: 'tower' },
  { ratio: 'landscape', loose: true },
  { ratio: 'portrait', loose: true },
];

// Equal-area candidate footprints (wide 2x1 vs tall 1x2) handed to a handful
// of demo items so exact-mode packing can visibly choose whichever shape
// fits the current skyline gap tighter.
const VARIANT_SPANS: [number, number][] = [
  [2, 1],
  [1, 2],
];

export function generateDemoItems(count: number): DemoItemCardType[] {
  return Array.from({ length: count }, (_, i) => {
    const isVariantShowcase = i % 7 === 3;
    return {
      id: `demo-${i + 1}`,
      type: 'demo-item' as const,
      emoji: emojis[i % emojis.length],
      color: colors[i % colors.length],
      // Variant-showcase items skip the ratio format entirely - in exact
      // mode their shape is decided by variantSpans; in grid mode they fall
      // back to the default square footprint.
      format: isVariantShowcase ? undefined : ratios[i % ratios.length],
      variantSpans: isVariantShowcase ? VARIANT_SPANS : undefined,
    };
  });
}

// Static showcase cards (the UI/informational cards)
export const showcaseCards: ShowcaseCard[] = [
  // Hero card - large title
  {
    id: 'hero',
    type: 'hero',
    title: '🧩 masonry-quilt',
    subtitle: 'A pure TypeScript masonry layout calculator — items in, pixel positions out.',
    version: '2.0.1',
    format: { ratio: 'landscape' },
  },

  // Theme toggle
  {
    id: 'theme-toggle',
    type: 'theme-toggle',
    format: { ratio: '1:1' },
  },

  // Quick start code
  {
    id: 'quickstart',
    type: 'quickstart',
    code: QUICK_START_CODE,
    format: { ratio: 'portrait' },
  },

  // Stats card
  {
    id: 'stats',
    type: 'stats',
    format: { ratio: '1:1' },
  },

  // Control cards
  {
    id: 'control-cell-size',
    type: 'control-slider',
    label: 'Cell Size',
    settingKey: 'cellSize',
    min: 50,
    max: 400,
    step: 25,
    format: { ratio: 'landscape' },
  },
  {
    id: 'control-gap',
    type: 'control-slider',
    label: 'Gap',
    settingKey: 'gap',
    min: 0,
    max: 32,
    step: 4,
    format: { ratio: 'landscape' },
  },
  {
    id: 'control-card-count',
    type: 'control-slider',
    label: '+ Extra Cards',
    settingKey: 'cardCount',
    min: 0,
    max: 200,
    step: 5,
    format: { ratio: 'landscape' },
  },
  {
    id: 'control-border-radius',
    type: 'control-slider',
    label: 'Border Radius',
    settingKey: 'borderRadius',
    min: 0,
    max: 32,
    step: 2,
    format: { ratio: 'landscape' },
  },
  {
    id: 'control-ratios',
    type: 'control-ratio-filter',
    ratios: AVAILABLE_RATIOS,
    format: { ratio: 'banner' },
  },
  {
    id: 'control-packing-mode',
    type: 'control-packing',
    label: 'Packing Mode',
    format: { ratio: '1:1' },
  },

  // Feature cards
  {
    id: 'feature-order',
    type: 'feature',
    icon: '📋',
    title: 'Order Preserving',
    description: 'Items maintain their input order as closely as possible in the visual layout.',
    color: '#FF3366',
  },
  {
    id: 'feature-zero-deps',
    type: 'feature',
    icon: '📦',
    title: 'Zero Dependencies',
    description: 'Pure TypeScript, no external dependencies. Works anywhere JS runs.',
    color: '#00D9FF',
  },
  {
    id: 'feature-type-safe',
    type: 'feature',
    icon: '🔒',
    title: 'Type-Safe',
    description: 'Full TypeScript support with generics. Your custom item types flow through.',
    color: '#9D4EDD',
  },
  {
    id: 'feature-framework',
    type: 'feature',
    icon: '🔌',
    title: 'Framework Agnostic',
    description: 'Works with React, Vue, Svelte, vanilla DOM, Canvas, or any rendering target.',
    color: '#00FF88',
  },
  {
    id: 'feature-pixel',
    type: 'feature',
    icon: '📐',
    title: 'Pixel Perfect',
    description: 'Returns exact x, y, width, height coordinates. You control the rendering.',
    color: '#FFD600',
  },
  {
    id: 'feature-css-grid',
    type: 'feature',
    icon: '🔲',
    title: 'CSS Grid Support',
    description: 'Optional grid metadata (col, row, spans) for CSS Grid layouts.',
    color: '#FF6B00',
  },

  // Metric cards
  {
    id: 'metric-utilization',
    type: 'metric',
    metricKey: 'utilization',
    label: 'Utilization',
    icon: '📊',
    color: 'var(--accent-3)',
  },
  {
    id: 'metric-fidelity',
    type: 'metric',
    metricKey: 'orderFidelity',
    label: 'Order Fidelity',
    icon: '🎯',
    color: 'var(--accent-5)',
  },
  {
    id: 'metric-calc-time',
    type: 'metric',
    metricKey: 'calcTime',
    label: 'Calc Time',
    icon: '⚡',
    color: 'var(--accent-2)',
  },
  {
    id: 'metric-grid',
    type: 'metric',
    metricKey: 'gridDimensions',
    label: 'Grid Size',
    icon: '📏',
    color: 'var(--accent-4)',
  },

  // Link cards
  {
    id: 'link-github',
    type: 'link',
    icon: '🐙',
    label: 'GitHub',
    url: 'https://github.com/burka/masonry-quilt',
    color: '#24292e',
  },
  {
    id: 'link-npm',
    type: 'link',
    icon: '📦',
    label: 'npm',
    url: 'https://www.npmjs.com/package/masonry-quilt',
    color: '#cb3837',
  },

  // Code examples
  {
    id: 'code-react',
    type: 'code',
    title: 'React Example',
    language: 'tsx',
    code: `<MasonryGrid items={items}>
  {(card) => (
    <div style={{
      background: card.item.color
    }}>
      {card.item.title}
    </div>
  )}
</MasonryGrid>`,
    format: { ratio: 'portrait' },
  },
  {
    id: 'code-css-grid',
    type: 'code',
    title: 'CSS Grid Output',
    language: 'css',
    code: `grid-column: span 2;
grid-row: span 3;
/* From: card.grid.colSpan, rowSpan */`,
  },
];
