/**
 * Example usage of masonry-quilt v2.0.0
 */

import { calculateLayout } from "./src/index";

// Example 1: Basic layout (items placed in input order)
console.log("=== Example 1: Basic Layout ===");

interface NoteItem {
  id: string;
  title?: string;
}

const items: NoteItem[] = [
  { id: "note-1", title: "First" },
  { id: "note-2", title: "Second" },
  { id: "note-3", title: "Third" },
  { id: "note-4", title: "Fourth" },
  { id: "note-5", title: "Fifth" },
];

const result = calculateLayout(items, 1920, 1080);

console.log("Placed cards:", result.cards.length);
console.log("Layout dimensions:", result.width, "x", result.height, "px");
console.log("Utilization:", (result.utilization * 100).toFixed(1) + "%");
console.log("Order fidelity:", (result.orderFidelity * 100).toFixed(1) + "%");
console.log("\nCard positions:");
result.cards.forEach((card) => {
  console.log(`  ${card.item.id}: ${card.width}x${card.height}px at (${card.x}, ${card.y})`);
});

// Example 2: Format constraints
console.log("\n=== Example 2: Format Constraints ===");

interface FormatItem {
  id: string;
  format?: { ratio?: string; size?: { width: number; height: number }; minSize?: { width: number; height: number } };
}

const formatItems: FormatItem[] = [
  { id: "video", format: { ratio: "16:9" } },
  { id: "portrait", format: { ratio: "portrait" } },
  { id: "banner", format: { ratio: "banner" } },
  { id: "exact", format: { size: { width: 400, height: 200 } } },
  { id: "big", format: { minSize: { width: 600, height: 400 } } },
];

const formatResult = calculateLayout(formatItems, 1920, 1080);
console.log("Format-constrained layout:");
formatResult.cards.forEach((card) => {
  const ratio = (card.width / card.height).toFixed(2);
  console.log(`  ${card.item.id}: ${card.width}x${card.height}px, ratio: ${ratio}`);
});

// Example 3: CSS Grid support
console.log("\n=== Example 3: CSS Grid Support ===");
const gridResult = calculateLayout(items, 1920, 1080, { includeGrid: true });
console.log("Grid data for CSS Grid:");
gridResult.cards.forEach((card) => {
  console.log(`  ${card.item.id}: grid-column: ${card.grid!.col} / span ${card.grid!.colSpan}, grid-row: ${card.grid!.row} / span ${card.grid!.rowSpan}`);
});

console.log("\n=== Summary ===");
console.log("All examples completed successfully!");
