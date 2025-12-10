/**
 * Example: Looseness Configuration
 *
 * Demonstrates how looseness affects order vs packing trade-off
 */

import { calculateLayout } from "./src/index";

interface CardItem {
  id: string;
  order: number;
}

const items: CardItem[] = Array.from({ length: 20 }, (_, i) => ({
  id: `card-${i}`,
  order: i,
}));

console.log("=== Looseness Comparison ===\n");

// 1. Strict order (looseness: 0)
console.log("1. STRICT ORDER (looseness: 0):");
const strictResult = calculateLayout(items, 1920, 1080, { looseness: 0 });
console.log(`   Order fidelity: ${(strictResult.orderFidelity * 100).toFixed(1)}%`);
console.log(`   Utilization: ${(strictResult.utilization * 100).toFixed(1)}%`);
console.log(`   First 5 cards: ${strictResult.cards.slice(0, 5).map((c) => c.item.id).join(", ")}\n`);

// 2. Default (looseness: 0.2)
console.log("2. DEFAULT (looseness: 0.2):");
const defaultResult = calculateLayout(items, 1920, 1080);
console.log(`   Order fidelity: ${(defaultResult.orderFidelity * 100).toFixed(1)}%`);
console.log(`   Utilization: ${(defaultResult.utilization * 100).toFixed(1)}%`);
console.log(`   First 5 cards: ${defaultResult.cards.slice(0, 5).map((c) => c.item.id).join(", ")}\n`);

// 3. Loose (looseness: 0.5)
console.log("3. LOOSE (looseness: 0.5):");
const looseResult = calculateLayout(items, 1920, 1080, { looseness: 0.5 });
console.log(`   Order fidelity: ${(looseResult.orderFidelity * 100).toFixed(1)}%`);
console.log(`   Utilization: ${(looseResult.utilization * 100).toFixed(1)}%`);
console.log(`   First 5 cards: ${looseResult.cards.slice(0, 5).map((c) => c.item.id).join(", ")}\n`);

// 4. Full reorder (looseness: 1)
console.log("4. FULL REORDER (looseness: 1):");
const fullResult = calculateLayout(items, 1920, 1080, { looseness: 1 });
console.log(`   Order fidelity: ${(fullResult.orderFidelity * 100).toFixed(1)}%`);
console.log(`   Utilization: ${(fullResult.utilization * 100).toFixed(1)}%`);
console.log(`   First 5 cards: ${fullResult.cards.slice(0, 5).map((c) => c.item.id).join(", ")}\n`);

console.log("=== Determinism Check ===\n");
console.log("Results are 100% deterministic (same input → same output):");
const check1 = calculateLayout(items, 1920, 1080, { looseness: 0.2 });
const check2 = calculateLayout(items, 1920, 1080, { looseness: 0.2 });
console.log(`   Run 1 first card: ${check1.cards[0].item.id}`);
console.log(`   Run 2 first card: ${check2.cards[0].item.id}`);
console.log(`   Identical: ${check1.cards[0].item.id === check2.cards[0].item.id ? "✓" : "✗"}`);
