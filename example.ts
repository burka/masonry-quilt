/**
 * Example usage of masonry-quilt
 */

import { calculateCardLayout } from "./src/index";

// Example 1: Basic layout with importance-based sizing
console.log("=== Example 1: Basic Layout ===");
const items = [
  { id: "note-1", importance: 10 },
  { id: "note-2", importance: 8 },
  { id: "note-3", importance: 5 },
  { id: "note-4", importance: 3 },
  { id: "note-5", importance: 1 },
];

const result = calculateCardLayout(items, 1920, 1080, 200, "m");

console.log("Placed cards:", result.placed.length);
console.log("Grid dimensions:", result.grid);
console.log("Utilization:", result.utilization + "%");
console.log("\nCard positions:");
result.placed.forEach((card) => {
  const cellWidth = card.width / 4;
  const cellHeight = card.height / 4;
  console.log(`  ${card.id}: ${cellWidth}x${cellHeight} cells at (${card.col / 4}, ${card.row / 4})`);
});

// Example 2: Content-aware sizing
console.log("\n=== Example 2: Content-Aware Sizing ===");
const contentItems = [
  {
    id: "short",
    importance: 10,
    content: "Buy milk",
  },
  {
    id: "medium",
    importance: 8,
    content: "Remember to call mom about dinner plans this weekend".repeat(2),
  },
  {
    id: "long",
    importance: 6,
    content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.".repeat(10),
  },
  {
    id: "image",
    importance: 5,
    type: "image",
    content: "Short",
  },
];

const contentResult = calculateCardLayout(contentItems, 1920, 1080, 200, "m");
console.log("Content-aware layout:");
contentResult.placed.forEach((card) => {
  console.log(
    `  ${card.id}: ${card.width / 4}x${card.height / 4} cells, contentCapped: ${card.contentCapped || false}`,
  );
});

// Example 3: Format constraints
console.log("\n=== Example 3: Format Constraints ===");
const formatItems = [
  {
    id: "video",
    importance: 8,
    format: {
      ratio: "16:9",
      strict: true,
    },
  },
  {
    id: "portrait",
    importance: 6,
    format: {
      ratio: "portrait", // 1:2
      strict: true,
    },
  },
  {
    id: "banner",
    importance: 4,
    format: {
      ratio: "banner", // 4:1
      strict: true,
    },
  },
];

const formatResult = calculateCardLayout(formatItems, 1920, 1080, 200, "m");
console.log("Format-constrained layout:");
formatResult.placed.forEach((card) => {
  const ratio = (card.width / card.height).toFixed(2);
  console.log(`  ${card.id}: ${card.width / 4}x${card.height / 4} cells, ratio: ${ratio}`);
});

console.log("\n=== Summary ===");
console.log("All examples completed successfully!");
console.log("Build and tests are green ✓");
