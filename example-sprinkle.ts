/**
 * Example: Sprinkle Effect Configuration
 *
 * Demonstrates how to configure or disable the sprinkle effect
 */

import { calculateCardLayout } from "./src/index";

const items = Array.from({ length: 20 }, (_, i) => ({
  id: `card-${i}`,
  importance: 20 - i, // Descending importance
}));

console.log("=== Sprinkle Effect Comparison ===\n");

// 1. Default behavior (sprinkle enabled with 20% boost)
console.log("1. DEFAULT (sprinkle enabled, 20% boost):");
const defaultResult = calculateCardLayout(items, 1920, 1080, 200, "m");
console.log(`   Top 5 cards: ${defaultResult.placed.slice(0, 5).map((c) => c.id).join(", ")}`);
console.log(`   Utilization: ${defaultResult.utilization}%\n`);

// 2. Sprinkle disabled (strict importance order)
console.log("2. SPRINKLE DISABLED (strict order):");
const noSprinkleResult = calculateCardLayout(items, 1920, 1080, 200, "m", {
  sprinkle: false,
});
console.log(
  `   Top 5 cards: ${noSprinkleResult.placed.slice(0, 5).map((c) => c.id).join(", ")}`,
);
console.log(`   Utilization: ${noSprinkleResult.utilization}%\n`);

// 3. High sprinkle (50% boost)
console.log("3. HIGH SPRINKLE (50% boost):");
const highSprinkleResult = calculateCardLayout(items, 1920, 1080, 200, "m", {
  sprinkle: {
    enabled: true,
    percentage: 0.5, // 50% of cards get boosted
    boost: 0.4, // Larger boost amount
  },
});
console.log(
  `   Top 5 cards: ${highSprinkleResult.placed.slice(0, 5).map((c) => c.id).join(", ")}`,
);
console.log(`   Utilization: ${highSprinkleResult.utilization}%\n`);

// 4. Minimal sprinkle (10% boost)
console.log("4. MINIMAL SPRINKLE (10% boost):");
const minimalSprinkleResult = calculateCardLayout(items, 1920, 1080, 200, "m", {
  sprinkle: {
    enabled: true,
    percentage: 0.1, // Only 10% get boosted
    boost: 0.2, // Small boost
  },
});
console.log(
  `   Top 5 cards: ${minimalSprinkleResult.placed.slice(0, 5).map((c) => c.id).join(", ")}`,
);
console.log(`   Utilization: ${minimalSprinkleResult.utilization}%\n`);

console.log("=== Determinism Check ===\n");
console.log(
  "With sprinkle DISABLED, results are 100% deterministic (same every time):",
);
const check1 = calculateCardLayout(items, 1920, 1080, 200, "m", {
  sprinkle: false,
});
const check2 = calculateCardLayout(items, 1920, 1080, 200, "m", {
  sprinkle: false,
});
console.log(`   Run 1 first card: ${check1.placed[0].id}`);
console.log(`   Run 2 first card: ${check2.placed[0].id}`);
console.log(`   Identical: ${check1.placed[0].id === check2.placed[0].id ? "✓" : "✗"}\n`);

console.log(
  "With sprinkle ENABLED, results are deterministic BUT order varies (controlled randomness):",
);
const check3 = calculateCardLayout(items, 1920, 1080, 200, "m", {
  sprinkle: true,
});
const check4 = calculateCardLayout(items, 1920, 1080, 200, "m", {
  sprinkle: true,
});
console.log(`   Run 1 first card: ${check3.placed[0].id}`);
console.log(`   Run 2 first card: ${check4.placed[0].id}`);
console.log(
  `   Identical: ${check3.placed[0].id === check4.placed[0].id ? "✓" : "✗"} (deterministic based on IDs)`,
);
