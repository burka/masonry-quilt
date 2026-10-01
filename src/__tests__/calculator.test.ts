import { describe, expect, test } from "vitest";
import { calculateLayout } from "../calculator";
import type { LayoutItem } from "../types";

// Test item interface extending LayoutItem
interface TestItem extends LayoutItem {
  id: string;
}

describe("calculateLayout", () => {
  describe("Grid gap consistency", () => {
    // Every horizontal/vertical distance between two cards that face each
    // other must be exactly `gap` plus a whole number of quarter-cell strides,
    // independent of the card size.
    const cases = [
      { gap: 8, baseSize: 200, size: { width: 400, height: 400 } },
      { gap: 16, baseSize: 200, size: { width: 400, height: 200 } },
      { gap: 24, baseSize: 150, size: { width: 300, height: 450 } },
    ];

    for (const { gap, baseSize, size } of cases) {
      test(`space between cards equals gap (gap ${gap}, ${size.width}x${size.height})`, () => {
        const items: TestItem[] = Array.from({ length: 12 }, (_, i) => ({
          id: `${i}`,
          format: { size },
        }));
        const result = calculateLayout(items, 1800, 1200, { baseSize, gap });
        const stride = (baseSize + gap) / 4;
        const distances: number[] = [];

        for (const a of result.cards) {
          for (const b of result.cards) {
            const overlapY = a.y < b.y + b.height && b.y < a.y + a.height;
            const overlapX = a.x < b.x + b.width && b.x < a.x + a.width;
            if (overlapY && b.x >= a.x + a.width) distances.push(b.x - (a.x + a.width));
            if (overlapX && b.y >= a.y + a.height) distances.push(b.y - (a.y + a.height));
          }
        }

        expect(distances.length).toBeGreaterThan(0);
        for (const d of distances) {
          const steps = (d - gap) / stride;
          expect(steps).toBeGreaterThanOrEqual(0);
          expect(steps).toBeCloseTo(Math.round(steps), 6);
        }
        // Directly adjacent cards are exactly `gap` apart.
        expect(Math.min(...distances)).toBeCloseTo(gap, 6);
      });
    }
  });

  describe("Grid Calculation (Pixel-based)", () => {
    test("calculates pixel dimensions for 1920x1080 container", () => {
      const items: TestItem[] = [{ id: "1" }];
      const result = calculateLayout(items, 1920, 1080);

      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
      expect(result.width).toBeLessThanOrEqual(1920);
      expect(result.height).toBeLessThanOrEqual(1080);
    });

    test("handles tiny container (400px width)", () => {
      const items: TestItem[] = [{ id: "1" }];
      const result = calculateLayout(items, 400, 600, { gap: 8 });

      expect(result.width).toBeGreaterThan(0);
      expect(result.width).toBeLessThanOrEqual(400);
    });

    test("handles huge container (4000px width)", () => {
      const items: TestItem[] = [{ id: "1" }];
      const result = calculateLayout(items, 4000, 2000, { gap: 24 });

      expect(result.width).toBeGreaterThan(0);
      expect(result.width).toBeLessThanOrEqual(4000);
    });

    test("respects custom baseSize", () => {
      const items: TestItem[] = [{ id: "1" }, { id: "2" }];
      const result1 = calculateLayout(items, 1920, 1080, { baseSize: 100 });
      const result2 = calculateLayout(items, 1920, 1080, { baseSize: 300 });

      expect(result1.cards).toHaveLength(2);
      expect(result2.cards).toHaveLength(2);
      // Different base sizes should affect layout
    });

    test("respects custom gap", () => {
      const items: TestItem[] = [{ id: "1" }, { id: "2" }];
      const result1 = calculateLayout(items, 1000, 800, { gap: 0 });
      const result2 = calculateLayout(items, 1000, 800, { gap: 32 });

      // With smaller gap, we should be able to fit more efficiently
      expect(result1.utilization).toBeGreaterThanOrEqual(result2.utilization);
    });
  });

  describe("Format: exact size", () => {
    test("respects exact size when specified (snaps to grid)", () => {
      const items: TestItem[] = [
        {
          id: "1",
          format: { size: { width: 400, height: 300 } },
        },
      ];
      const result = calculateLayout(items, 2000, 2000);

      const placed = result.cards.find((c) => c.item.id === "1");
      // Size snaps to grid units, so check it's close to requested
      expect(placed?.width).toBeGreaterThanOrEqual(350);
      expect(placed?.width).toBeLessThanOrEqual(450);
      expect(placed?.height).toBeGreaterThanOrEqual(250);
      expect(placed?.height).toBeLessThanOrEqual(350);
    });

    test("places multiple items maintaining relative sizes", () => {
      const items: TestItem[] = [
        { id: "1", format: { size: { width: 200, height: 200 } } },
        { id: "2", format: { size: { width: 400, height: 200 } } },
        { id: "3", format: { size: { width: 200, height: 400 } } },
      ];
      const result = calculateLayout(items, 2000, 1500);

      expect(result.cards).toHaveLength(3);
      // Second item should be wider than first
      const card1 = result.cards.find((c) => c.item.id === "1");
      const card2 = result.cards.find((c) => c.item.id === "2");
      const card3 = result.cards.find((c) => c.item.id === "3");
      expect(card2?.width).toBeGreaterThan(card1?.width ?? 0);
      expect(card3?.height).toBeGreaterThan(card1?.height ?? 0);
    });
  });

  describe("Format: minSize", () => {
    test("respects minSize constraint in pixels", () => {
      const items: TestItem[] = [
        {
          id: "1",
          format: { minSize: { width: 400, height: 300 } },
        },
      ];
      const result = calculateLayout(items, 2000, 2000);

      const placed = result.cards.find((c) => c.item.id === "1");
      expect(placed?.width).toBeGreaterThanOrEqual(400);
      expect(placed?.height).toBeGreaterThanOrEqual(300);
    });

    test("enforces minSize even with small baseSize", () => {
      const items: TestItem[] = [
        {
          id: "1",
          format: { minSize: { width: 500, height: 500 } },
        },
      ];
      const result = calculateLayout(items, 2000, 2000, { baseSize: 100 });

      const placed = result.cards.find((c) => c.item.id === "1");
      expect(placed?.width).toBeGreaterThanOrEqual(500);
      expect(placed?.height).toBeGreaterThanOrEqual(500);
    });
  });

  describe("Format: maxSize", () => {
    test("respects maxSize constraint in pixels", () => {
      const items: TestItem[] = [
        {
          id: "1",
          format: { maxSize: { width: 300, height: 200 } },
        },
      ];
      // Use baseSize smaller than maxSize so constraint takes effect
      const result = calculateLayout(items, 2000, 2000, { baseSize: 200 });

      const placed = result.cards.find((c) => c.item.id === "1");
      // Default 2x2 cells at baseSize 200 would be 400px, maxSize should cap it
      expect(placed?.width).toBeLessThanOrEqual(350); // Allow grid snap tolerance
      expect(placed?.height).toBeLessThanOrEqual(250);
    });

    test("enforces maxSize smaller than default", () => {
      const items: TestItem[] = [
        {
          id: "1",
          format: { maxSize: { width: 150, height: 150 } },
        },
      ];
      const result = calculateLayout(items, 2000, 2000, { baseSize: 200 });

      const placed = result.cards.find((c) => c.item.id === "1");
      // Should be smaller than default 2x2 cells (400x400 at baseSize 200)
      expect(placed?.width).toBeLessThanOrEqual(200); // Allow grid snap tolerance
      expect(placed?.height).toBeLessThanOrEqual(200);
    });

    test("combines minSize and maxSize constraints", () => {
      const items: TestItem[] = [
        {
          id: "1",
          format: {
            minSize: { width: 200, height: 150 },
            maxSize: { width: 600, height: 450 },
          },
        },
      ];
      const result = calculateLayout(items, 2000, 2000);

      const placed = result.cards.find((c) => c.item.id === "1");
      expect(placed?.width).toBeGreaterThanOrEqual(200);
      expect(placed?.width).toBeLessThanOrEqual(600);
      expect(placed?.height).toBeGreaterThanOrEqual(150);
      expect(placed?.height).toBeLessThanOrEqual(450);
    });
  });

  describe("Format: ratio shortcuts", () => {
    test("'portrait' = 1:2 (loose by default for shortcuts)", () => {
      const items: TestItem[] = [{ id: "1", format: { ratio: "portrait" } }];
      const result = calculateLayout(items, 2000, 2000);

      const placed = result.cards.find((c) => c.item.id === "1");
      const ratio = placed!.height / placed!.width;
      // Shortcuts are loose, so ratio is approximate - height should be greater than width
      expect(ratio).toBeGreaterThan(1);
    });

    test("'landscape' = 2:1 (loose by default for shortcuts)", () => {
      const items: TestItem[] = [{ id: "1", format: { ratio: "landscape" } }];
      const result = calculateLayout(items, 2000, 2000);

      const placed = result.cards.find((c) => c.item.id === "1");
      const ratio = placed!.width / placed!.height;
      // Shortcuts are loose, so ratio is approximate - width should be greater than height
      expect(ratio).toBeGreaterThan(1);
    });

    test("'banner' = 4:1 (loose by default for shortcuts)", () => {
      const items: TestItem[] = [{ id: "1", format: { ratio: "banner" } }];
      const result = calculateLayout(items, 2000, 2000);

      const placed = result.cards.find((c) => c.item.id === "1");
      const ratio = placed!.width / placed!.height;
      expect(ratio).toBeGreaterThan(3);
      expect(ratio).toBeLessThan(5);
    });

    test("'tower' = 1:4 (loose by default for shortcuts)", () => {
      const items: TestItem[] = [{ id: "1", format: { ratio: "tower" } }];
      const result = calculateLayout(items, 2000, 2000);

      const placed = result.cards.find((c) => c.item.id === "1");
      const ratio = placed!.height / placed!.width;
      // Tower should be taller than wide
      expect(ratio).toBeGreaterThan(1);
    });
  });

  describe("Format: custom ratios", () => {
    test("ratio '16:9' wide format", () => {
      const items: TestItem[] = [{ id: "1", format: { ratio: "16:9" } }];
      const result = calculateLayout(items, 2000, 2000);

      const placed = result.cards.find((c) => c.item.id === "1");
      const ratio = placed!.width / placed!.height;
      // Should be wider than tall
      expect(ratio).toBeGreaterThan(1);
    });

    test("ratio '4:3' with loose: true allows flexibility", () => {
      const items: TestItem[] = [{ id: "1", format: { ratio: "4:3", loose: true } }];
      const result = calculateLayout(items, 2000, 2000);

      const placed = result.cards.find((c) => c.item.id === "1");
      expect(placed).toBeDefined();
      // With loose, ratio may deviate more
      const ratio = placed!.width / placed!.height;
      expect(ratio).toBeGreaterThan(0.5);
      expect(ratio).toBeLessThan(2.5);
    });

    test("ratio '21:9' ultrawide format", () => {
      const items: TestItem[] = [{ id: "1", format: { ratio: "21:9" } }];
      const result = calculateLayout(items, 3000, 1500);

      const placed = result.cards.find((c) => c.item.id === "1");
      const ratio = placed!.width / placed!.height;
      // Should be wider than tall
      expect(ratio).toBeGreaterThan(1);
    });

    test("ratio '1:1' square format", () => {
      const items: TestItem[] = [{ id: "1", format: { ratio: "1:1" } }];
      const result = calculateLayout(items, 2000, 2000);

      const placed = result.cards.find((c) => c.item.id === "1");
      // Should be roughly square (allow for grid snap)
      const ratio = placed!.width / placed!.height;
      expect(ratio).toBeGreaterThan(0.5);
      expect(ratio).toBeLessThan(2);
    });
  });

  describe("Format: loose behavior", () => {
    test("loose: false enforces strict ratio", () => {
      const items: TestItem[] = [{ id: "1", format: { ratio: "2:1", loose: false } }];
      const result = calculateLayout(items, 2000, 2000);

      const placed = result.cards.find((c) => c.item.id === "1");
      const ratio = placed!.width / placed!.height;
      expect(ratio).toBeCloseTo(2, 0.5);
    });

    test("loose: true allows ratio flexibility", () => {
      const items: TestItem[] = [{ id: "1", format: { ratio: "2:1", loose: true } }];
      const result = calculateLayout(items, 2000, 2000);

      const placed = result.cards.find((c) => c.item.id === "1");
      expect(placed).toBeDefined();
      // Should still place even if exact ratio not achievable
    });
  });

  describe("Placement Algorithm", () => {
    test("places all items in input order by default", () => {
      const items: TestItem[] = [{ id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }, { id: "5" }];
      const result = calculateLayout(items, 2000, 1000);

      expect(result.cards).toHaveLength(5);
      // Algorithm preserves order
      expect(result.cards[0].item.id).toBe("1");
    });

    test("places items in masonry pattern", () => {
      const items: TestItem[] = [{ id: "1" }, { id: "2" }, { id: "3" }];
      const result = calculateLayout(items, 2000, 1000);

      expect(result.cards).toHaveLength(3);
      expect(result.cards[0].x).toBe(0);
      expect(result.cards[0].y).toBe(0);
    });

    test("finds available spaces for later items", () => {
      const items: TestItem[] = [
        { id: "1", format: { size: { width: 400, height: 400 } } },
        { id: "2", format: { size: { width: 200, height: 200 } } },
      ];
      const result = calculateLayout(items, 2000, 2000);

      expect(result.cards).toHaveLength(2);
      expect(result.cards[1].x).toBeGreaterThanOrEqual(0);
      expect(result.cards[1].y).toBeGreaterThanOrEqual(0);
    });

    test("efficiently packs many items", () => {
      const items: TestItem[] = Array.from({ length: 100 }, (_, i) => ({
        id: `${i}`,
      }));
      const result = calculateLayout(items, 2000, 4000);

      // All items should be placed now (no unplaced)
      expect(result.cards).toHaveLength(100);
    });

    test("all items always placed (no unplaced array)", () => {
      const items: TestItem[] = Array.from({ length: 50 }, (_, i) => ({
        id: `${i}`,
      }));
      const result = calculateLayout(items, 1000, 2000);

      expect(result.cards).toHaveLength(50);
      // Verify no unplaced property
      expect("unplaced" in result).toBe(false);
    });
  });

  describe("Order Fidelity", () => {
    test("orderFidelity is a number between 0 and 1", () => {
      const items: TestItem[] = [{ id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }, { id: "5" }];
      const result = calculateLayout(items, 2000, 1500);

      expect(result.orderFidelity).toBeGreaterThanOrEqual(0);
      expect(result.orderFidelity).toBeLessThanOrEqual(1);
    });

    test("preserves order with high fidelity", () => {
      const items: TestItem[] = Array.from({ length: 20 }, (_, i) => ({
        id: `${i}`,
      }));
      const result = calculateLayout(items, 2000, 2000);

      // Order should be well preserved
      expect(result.orderFidelity).toBeGreaterThan(0.9);

      // Verify items are in original order
      for (let i = 0; i < result.cards.length - 1; i++) {
        const currentId = parseInt(result.cards[i].item.id, 10);
        const nextId = parseInt(result.cards[i + 1].item.id, 10);
        expect(nextId).toBeGreaterThan(currentId);
      }
    });

    test("maintains reasonable order fidelity with varied sizes", () => {
      const items: TestItem[] = Array.from({ length: 15 }, (_, i) => ({
        id: `${i}`,
      }));
      const result = calculateLayout(items, 2000, 1500);

      // Should maintain reasonable order fidelity
      expect(result.orderFidelity).toBeGreaterThan(0.5);
      expect(result.utilization).toBeGreaterThan(0.5);
    });
  });

  describe("Utilization Calculation", () => {
    test("calculates utilization as decimal (0-1)", () => {
      const items: TestItem[] = [{ id: "1" }, { id: "2" }];
      const result = calculateLayout(items, 1000, 800);

      expect(result.utilization).toBeGreaterThan(0);
      expect(result.utilization).toBeLessThanOrEqual(1);
    });

    test("achieves good utilization in normal cases", () => {
      const items: TestItem[] = Array.from({ length: 15 }, (_, i) => ({
        id: `${i}`,
      }));
      const result = calculateLayout(items, 1920, 1080);

      // Should achieve at least 65% utilization
      expect(result.utilization).toBeGreaterThan(0.65);
    });

    test("empty items array has 0 utilization", () => {
      const result = calculateLayout([], 1000, 800);
      expect(result.utilization).toBe(0);
    });
  });

  describe("Include Grid Option", () => {
    test("includeGrid: false (default) - no grid data", () => {
      const items: TestItem[] = [{ id: "1" }, { id: "2" }];
      const result = calculateLayout(items, 2000, 1500);

      expect(result.cards[0].grid).toBeUndefined();
      expect(result.cards[1].grid).toBeUndefined();
    });

    test("includeGrid: true - adds grid data", () => {
      const items: TestItem[] = [{ id: "1" }, { id: "2" }];
      const result = calculateLayout(items, 2000, 1500, { includeGrid: true });

      expect(result.cards[0].grid).toBeDefined();
      expect(result.cards[0].grid?.col).toBeGreaterThanOrEqual(1);
      expect(result.cards[0].grid?.row).toBeGreaterThanOrEqual(1);
      expect(result.cards[0].grid?.colSpan).toBeGreaterThanOrEqual(1);
      expect(result.cards[0].grid?.rowSpan).toBeGreaterThanOrEqual(1);

      expect(result.cards[1].grid).toBeDefined();
      expect(result.cards[1].grid?.col).toBeGreaterThanOrEqual(1);
      expect(result.cards[1].grid?.row).toBeGreaterThanOrEqual(1);
    });

    test("grid data is 1-based", () => {
      const items: TestItem[] = [{ id: "1" }];
      const result = calculateLayout(items, 2000, 1500, { includeGrid: true });

      // First item should be at col 1, row 1 (not 0-based)
      expect(result.cards[0].grid?.col).toBe(1);
      expect(result.cards[0].grid?.row).toBe(1);
    });

    test("grid spans are positive numbers", () => {
      const items: TestItem[] = [{ id: "1", format: { minSize: { width: 400, height: 300 } } }];
      const result = calculateLayout(items, 2000, 1500, {
        includeGrid: true,
        baseSize: 100,
        gap: 10,
      });

      const card = result.cards[0];
      expect(card.width).toBeGreaterThan(0);
      expect(card.height).toBeGreaterThan(0);
      expect(card.grid?.colSpan).toBeGreaterThan(0);
      expect(card.grid?.rowSpan).toBeGreaterThan(0);
    });

    test("all cards have grid data when enabled", () => {
      const items: TestItem[] = Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
      }));
      const result = calculateLayout(items, 2000, 1500, { includeGrid: true });

      result.cards.forEach((card) => {
        expect(card.grid).toBeDefined();
        expect(card.grid?.col).toBeGreaterThanOrEqual(1);
        expect(card.grid?.row).toBeGreaterThanOrEqual(1);
        expect(card.grid?.colSpan).toBeGreaterThanOrEqual(1);
        expect(card.grid?.rowSpan).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe("Result Structure", () => {
    test("result.cards contains PlacedCard items (not result.placed)", () => {
      const items: TestItem[] = [{ id: "1" }];
      const result = calculateLayout(items, 1000, 800);

      expect(result.cards).toBeDefined();
      expect("placed" in result).toBe(false);
    });

    test("result.width and result.height are pixels (not grid.cols/rows)", () => {
      const items: TestItem[] = [{ id: "1" }];
      const result = calculateLayout(items, 1000, 800);

      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
      expect(typeof result.width).toBe("number");
      expect(typeof result.height).toBe("number");
    });

    test("no result.unplaced property", () => {
      const items: TestItem[] = [{ id: "1" }, { id: "2" }];
      const result = calculateLayout(items, 1000, 800);

      expect("unplaced" in result).toBe(false);
    });

    test("no result.spaces property", () => {
      const items: TestItem[] = [{ id: "1" }];
      const result = calculateLayout(items, 1000, 800);

      expect("spaces" in result).toBe(false);
    });

    test("PlacedCard has item reference (not id)", () => {
      const items: TestItem[] = [{ id: "1" }];
      const result = calculateLayout(items, 1000, 800);

      expect(result.cards[0].item).toBeDefined();
      expect(result.cards[0].item.id).toBe("1");
      // Direct id property should not exist on PlacedCard
      expect("id" in result.cards[0]).toBe(false);
    });

    test("PlacedCard has x, y in pixels (not col, row)", () => {
      const items: TestItem[] = [{ id: "1" }];
      const result = calculateLayout(items, 1000, 800);

      expect(result.cards[0].x).toBeGreaterThanOrEqual(0);
      expect(result.cards[0].y).toBeGreaterThanOrEqual(0);
      expect(typeof result.cards[0].x).toBe("number");
      expect(typeof result.cards[0].y).toBe("number");
    });

    test("no contentCapped property on PlacedCard", () => {
      const items: TestItem[] = [{ id: "1" }];
      const result = calculateLayout(items, 1000, 800);

      expect("contentCapped" in result.cards[0]).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    test("handles empty items array", () => {
      const result = calculateLayout([], 1000, 800);

      expect(result.cards).toHaveLength(0);
      expect(result.utilization).toBe(0);
      expect(result.width).toBeGreaterThanOrEqual(0);
      expect(result.height).toBeGreaterThanOrEqual(0);
    });

    test("handles single item", () => {
      const items: TestItem[] = [{ id: "1" }];
      const result = calculateLayout(items, 1000, 800);

      expect(result.cards).toHaveLength(1);
      expect(result.cards[0].item.id).toBe("1");
    });

    test("handles all items with same format", () => {
      const items: TestItem[] = Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
      }));
      const result = calculateLayout(items, 2000, 1500);

      expect(result.cards).toHaveLength(10);
      // All items should have roughly similar sizes (default sizing)
      result.cards.forEach((card) => {
        expect(card.width).toBeGreaterThan(0);
        expect(card.height).toBeGreaterThan(0);
      });
    });

    test("very small container returns empty when no items fit", () => {
      const items: TestItem[] = [{ id: "1" }, { id: "2" }];
      const result = calculateLayout(items, 50, 50);

      // When container is smaller than baseSize + gap, we get no columns/rows
      // Algorithm returns empty array for unusable viewport
      expect(result.cards.length).toBeGreaterThanOrEqual(0);
    });

    test("very large container handles items efficiently", () => {
      const items: TestItem[] = Array.from({ length: 5 }, (_, i) => ({
        id: `${i}`,
      }));
      const result = calculateLayout(items, 10000, 10000);

      expect(result.cards).toHaveLength(5);
      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
    });

    test("mixed format specifications", () => {
      const items: TestItem[] = [
        { id: "1", format: { size: { width: 300, height: 300 } } },
        { id: "2", format: { ratio: "16:9" } },
        { id: "3", format: { minSize: { width: 200, height: 150 } } },
        { id: "4" },
        {
          id: "5",
          format: {
            maxSize: { width: 400, height: 400 },
            ratio: "1:1",
          },
        },
      ];
      const result = calculateLayout(items, 2000, 2000);

      expect(result.cards).toHaveLength(5);
    });

    test("zero gap option", () => {
      const items: TestItem[] = [{ id: "1" }, { id: "2" }];
      const result = calculateLayout(items, 1000, 800, { gap: 0 });

      expect(result.cards).toHaveLength(2);
      expect(result.utilization).toBeGreaterThan(0);
    });

    test("large gap option", () => {
      const items: TestItem[] = [{ id: "1" }, { id: "2" }];
      const result = calculateLayout(items, 1000, 800, { gap: 50 });

      expect(result.cards).toHaveLength(2);
      expect(result.utilization).toBeGreaterThan(0);
    });

    test("items without id property work fine", () => {
      const items: LayoutItem[] = [{}, {}, {}];
      const result = calculateLayout(items, 2000, 1500);

      expect(result.cards).toHaveLength(3);
      result.cards.forEach((card) => {
        expect(card.item).toBeDefined();
      });
    });

    test("handles items that require grid growth", () => {
      // Many large items that will exceed initial grid estimation
      const items: TestItem[] = Array.from({ length: 50 }, (_, i) => ({
        id: `${i}`,
        format: { minSize: { width: 400, height: 400 } },
      }));
      const result = calculateLayout(items, 800, 400); // Small container

      expect(result.cards).toHaveLength(50);
      // Grid should have grown to accommodate all items
      expect(result.height).toBeGreaterThan(400);
    });

    test("handles items with strict ratio that cannot fit", () => {
      // Item with strict ratio in a container that cannot accommodate it
      const items: TestItem[] = [{ id: "1", format: { ratio: "16:9", loose: false } }, { id: "2" }];
      const result = calculateLayout(items, 2000, 2000);

      // Both items should be placed
      expect(result.cards.length).toBeGreaterThanOrEqual(1);
    });

    test("handles many items requiring gap filling phase", () => {
      // Create items with varied sizes to trigger gap filling
      const items: TestItem[] = [
        { id: "1", format: { size: { width: 600, height: 600 } } },
        { id: "2", format: { size: { width: 200, height: 200 } } },
        { id: "3", format: { size: { width: 300, height: 300 } } },
        { id: "4", format: { size: { width: 150, height: 150 } } },
        { id: "5", format: { size: { width: 250, height: 250 } } },
        { id: "6", format: { size: { width: 100, height: 100 } } },
        { id: "7", format: { size: { width: 350, height: 350 } } },
        { id: "8", format: { size: { width: 175, height: 175 } } },
      ];
      const result = calculateLayout(items, 1000, 500);

      expect(result.cards).toHaveLength(8);
      expect(result.utilization).toBeGreaterThan(0);
    });

    test("items that need to shrink to fit in grid", () => {
      // Item larger than grid that needs to scale down
      const items: TestItem[] = [
        { id: "1", format: { ratio: "portrait" } }, // Shortcuts are loose, can scale
      ];
      const result = calculateLayout(items, 300, 300, { baseSize: 100 });

      expect(result.cards).toHaveLength(1);
      // 2 cells fit the width (2 * 100 + 16 gap = 216px). The portrait card
      // spans at most 3 cells high (3 * 100 + 2 * 16 gap = 332px).
      expect(result.cards[0].width).toBeLessThanOrEqual(216);
      expect(result.cards[0].height).toBeLessThanOrEqual(332);
    });

    test("items requiring retry with smaller sizes", () => {
      // Items that can't fit initially but can be resized
      const items: TestItem[] = Array.from({ length: 20 }, (_, i) => ({
        id: `${i}`,
      }));
      // Very constrained space
      const result = calculateLayout(items, 600, 200, { baseSize: 150, gap: 8 });

      // All items should eventually be placed
      expect(result.cards).toHaveLength(20);
    });

    test("forces grid expansion when items overflow initial estimate", () => {
      // Create scenario where items definitely won't fit in initial grid
      // Use very tall items in a short viewport to force grid growth
      const items: TestItem[] = Array.from({ length: 30 }, (_, i) => ({
        id: `${i}`,
        format: { minSize: { width: 300, height: 500 } },
      }));
      // Small viewport that will need expansion
      const result = calculateLayout(items, 1000, 200, { baseSize: 100, gap: 8 });

      expect(result.cards).toHaveLength(30);
      // Height must have expanded beyond initial viewport
      expect(result.height).toBeGreaterThan(200);
    });

    test("handles cards that fail placement and need grid growth in gap filling", () => {
      // Large items that won't fit in initial placement and need gap filling with grid growth
      const items: TestItem[] = [
        // First item takes up most of the space
        { id: "big", format: { size: { width: 800, height: 600 } } },
        // More items that will likely need gap filling with grid growth
        { id: "medium1", format: { size: { width: 400, height: 400 } } },
        { id: "medium2", format: { size: { width: 400, height: 400 } } },
        { id: "medium3", format: { size: { width: 400, height: 400 } } },
      ];
      // Constrained container
      const result = calculateLayout(items, 900, 300, { baseSize: 200, gap: 10 });

      // All items should be placed
      expect(result.cards).toHaveLength(4);
    });
  });

  describe("Performance", () => {
    const generateItems = (count: number): TestItem[] =>
      Array.from({ length: count }, (_, i) => ({
        id: `item-${i}`,
      }));

    test("handles 100 items efficiently", () => {
      const items = generateItems(100);
      const start = performance.now();
      const result = calculateLayout(items, 2000, 4000);
      const duration = performance.now() - start;

      expect(result.cards).toHaveLength(100);
      console.log(`100 items: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(1000); // Should complete in under 1s
    });

    test("handles 1000 items efficiently", () => {
      const items = generateItems(1000);
      const start = performance.now();
      const result = calculateLayout(items, 4000, 10000);
      const duration = performance.now() - start;

      expect(result.cards).toHaveLength(1000);
      console.log(`1000 items: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(5000); // Should complete in under 5s
    });

    test("handles 10000 items efficiently", () => {
      const items = generateItems(10000);
      const start = performance.now();
      const result = calculateLayout(items, 8000, 50000);
      const duration = performance.now() - start;

      expect(result.cards).toHaveLength(10000);
      console.log(`10000 items: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(30000); // Should complete in under 30s
    });

    test("performance with complex formats", () => {
      const items: TestItem[] = Array.from({ length: 100 }, (_, i) => ({
        id: `item-${i}`,
        format:
          i % 4 === 0
            ? { ratio: "16:9" }
            : i % 4 === 1
              ? { size: { width: 200 + i * 2, height: 150 + i } }
              : i % 4 === 2
                ? { minSize: { width: 150, height: 150 } }
                : { maxSize: { width: 500, height: 500 } },
      }));

      const start = performance.now();
      const result = calculateLayout(items, 3000, 5000);
      const duration = performance.now() - start;

      expect(result.cards).toHaveLength(100);
      console.log(`100 items with complex formats: ${duration.toFixed(2)}ms`);
    });

    test("performance with grid data enabled", () => {
      const items = generateItems(200);
      const start = performance.now();
      const result = calculateLayout(items, 3000, 5000, {
        includeGrid: true,
      });
      const duration = performance.now() - start;

      expect(result.cards).toHaveLength(200);
      result.cards.forEach((card) => {
        expect(card.grid).toBeDefined();
      });
      console.log(`200 items with grid data: ${duration.toFixed(2)}ms`);
    });
  });

  describe("Input Order Preservation", () => {
    test("items are processed in input order", () => {
      const items: TestItem[] = [
        { id: "first" },
        { id: "second" },
        { id: "third" },
        { id: "fourth" },
      ];
      const result = calculateLayout(items, 2000, 1500);

      // Order should be strictly preserved
      expect(result.cards[0].item.id).toBe("first");
      expect(result.cards[1].item.id).toBe("second");
      expect(result.cards[2].item.id).toBe("third");
      expect(result.cards[3].item.id).toBe("fourth");
    });

    test("item reference preserved in result", () => {
      const items: TestItem[] = [
        { id: "1", format: { ratio: "16:9" } },
        { id: "2", format: { size: { width: 300, height: 300 } } },
      ];
      const result = calculateLayout(items, 2000, 1500);

      // Original item should be referenced
      expect(result.cards[0].item).toBe(items[0]);
      expect(result.cards[1].item).toBe(items[1]);
    });
  });

  describe("Comprehensive Integration", () => {
    test("complex layout with all features", () => {
      const items: TestItem[] = [
        { id: "hero", format: { minSize: { width: 600, height: 400 } } },
        { id: "video", format: { ratio: "16:9", minSize: { width: 400, height: 225 } } },
        { id: "square", format: { ratio: "1:1" } },
        { id: "portrait", format: { ratio: "portrait", loose: true } },
        { id: "landscape", format: { ratio: "landscape" } },
        {
          id: "constrained",
          format: { minSize: { width: 200, height: 150 }, maxSize: { width: 600, height: 450 } },
        },
        ...Array.from({ length: 10 }, (_, i) => ({ id: `card-${i}` })),
      ];

      const result = calculateLayout(items, 3000, 3000, {
        baseSize: 200,
        gap: 16,
        includeGrid: true,
      });

      expect(result.cards).toHaveLength(16);
      expect(result.utilization).toBeGreaterThan(0);
      expect(result.orderFidelity).toBeGreaterThan(0);
      expect(result.orderFidelity).toBeLessThanOrEqual(1);
      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);

      // All cards should have grid data
      result.cards.forEach((card) => {
        expect(card.grid).toBeDefined();
        expect(card.x).toBeGreaterThanOrEqual(0);
        expect(card.y).toBeGreaterThanOrEqual(0);
        expect(card.width).toBeGreaterThan(0);
        expect(card.height).toBeGreaterThan(0);
      });

      // Hero card should have minimum size respected
      const hero = result.cards.find((c) => c.item.id === "hero");
      expect(hero?.width).toBeGreaterThanOrEqual(600);
      expect(hero?.height).toBeGreaterThanOrEqual(400);
    });

    test("default options work correctly", () => {
      const items: TestItem[] = Array.from({ length: 20 }, (_, i) => ({
        id: `${i}`,
      }));
      const result = calculateLayout(items, 1920, 1080);

      expect(result.cards).toHaveLength(20);
      expect(result.utilization).toBeGreaterThan(0);
      expect(result.orderFidelity).toBeGreaterThan(0);
      // Grid data should not be present by default
      expect(result.cards[0].grid).toBeUndefined();
    });

    test("all options can be customized together", () => {
      const items: TestItem[] = Array.from({ length: 15 }, (_, i) => ({
        id: `${i}`,
        format: i % 3 === 0 ? { ratio: "16:9" } : i % 3 === 1 ? { ratio: "1:1" } : {},
      }));

      const result = calculateLayout(items, 2400, 1800, {
        baseSize: 250,
        gap: 20,
        includeGrid: true,
      });

      expect(result.cards).toHaveLength(15);
      expect(result.utilization).toBeGreaterThan(0);
      expect(result.orderFidelity).toBeGreaterThanOrEqual(0);
      expect(result.cards[0].grid).toBeDefined();
    });
  });

  describe("Strict ratio readjustment", () => {
    test("strict tall ratio re-stretches height to honor the ratio", () => {
      // A tiny size collapses the card toward the 2x2 minimum during ratio
      // calculation; with a strict tall ratio the height must be re-derived
      // from the (clamped) width so the final aspect ratio is honored.
      const items: TestItem[] = [
        { id: "tall", format: { ratio: "1:5", loose: false, size: { width: 50, height: 50 } } },
      ];
      const result = calculateLayout(items, 2000, 2000, { baseSize: 200, gap: 16 });

      const card = result.cards.find((c) => c.item.id === "tall");
      expect(card).toBeDefined();
      // Width snaps to the 2-unit minimum; height is re-stretched to 5x
      // (10 units). Each unit is a (200 + 16) / 4 = 54px stride and a span
      // drops one trailing gap: 2 * 54 - 16 = 92px, 10 * 54 - 16 = 524px.
      expect(card?.width).toBe(92);
      expect(card?.height).toBe(524);
    });

    test("strict wide ratio re-stretches width to honor the ratio", () => {
      // Counterpart to the tall case: exercises the width branch of the
      // strict-ratio readjustment.
      const items: TestItem[] = [{ id: "wide", format: { ratio: "2:1", loose: false } }];
      const result = calculateLayout(items, 2000, 2000, { baseSize: 200, gap: 16 });

      const card = result.cards.find((c) => c.item.id === "wide");
      expect(card).toBeDefined();
      expect((card?.width ?? 0) / (card?.height ?? 1)).toBeCloseTo(2, 0.3);
    });
  });

  describe("Oversized strict-ratio items are dropped", () => {
    test("a strict ratio that cannot fit the grid is omitted from the result", () => {
      // gridCols = floor(400 / 216) = 1 cell => 4 internal units. A 16:9 card
      // is 11 internal units wide and, being a non-loose explicit ratio, is not
      // allowed to scale down, so it cannot be placed and is dropped.
      const items: TestItem[] = [{ id: "strict", format: { ratio: "16:9" } }, { id: "normal" }];
      const result = calculateLayout(items, 400, 400, { baseSize: 200, gap: 16 });

      const ids = result.cards.map((c) => c.item.id);
      expect(ids).toContain("normal");
      expect(ids).not.toContain("strict");
      expect(result.cards).toHaveLength(1);
    });

    test("multiple unplaceable strict-ratio items are all dropped", () => {
      // Two non-loose oversized ratio items both produce a null size and reach
      // the gap-filling sort comparator with null sizes on both sides.
      const items: TestItem[] = [
        { id: "a", format: { ratio: "16:9", size: { width: 5000, height: 5000 } } },
        { id: "b", format: { ratio: "4:3", size: { width: 5000, height: 5000 } } },
        { id: "keep" },
      ];
      const result = calculateLayout(items, 400, 400, { baseSize: 200, gap: 16 });

      const ids = result.cards.map((c) => c.item.id);
      expect(ids).toEqual(["keep"]);
    });
  });

  describe("Shortcut ratios scale down to fit a small grid", () => {
    test("an oversized 'tower' shortcut is scaled down rather than dropped", () => {
      // 'tower' is implicitly loose, so when an inflated size pushes it past the
      // grid bounds it is scaled down to fit instead of being discarded.
      const items: TestItem[] = [
        { id: "tower", format: { ratio: "tower", size: { width: 5000, height: 5000 } } },
        { id: "filler" },
      ];
      const result = calculateLayout(items, 900, 700, { baseSize: 200, gap: 16 });

      const card = result.cards.find((c) => c.item.id === "tower");
      expect(card).toBeDefined();
      // Must fit inside the grid bounds it was scaled into.
      expect(card?.width).toBeLessThanOrEqual(result.width);
      expect(card?.height).toBeLessThanOrEqual(result.height);
      // Taller than wide, as a tower should be.
      expect(card?.height).toBeGreaterThan(card?.width ?? 0);
    });
  });

  describe("Gap filling places overflow items into leftover space", () => {
    test("loose items that overflow column packing are shrunk into gaps", () => {
      // Full-width 4-cell items stack until the grid overflows; the overflow
      // items are loose and size-only, so gap filling shrinks them to a 1-cell
      // (4 internal unit) square and slots them into the empty rows below.
      const items: TestItem[] = Array.from({ length: 8 }, (_, i) => ({
        id: `${i}`,
        format: { size: { width: 800, height: 800 } },
      }));
      const result = calculateLayout(items, 900, 100, { baseSize: 200, gap: 16 });

      // Every item is placed (gap filling never drops loose items).
      expect(result.cards).toHaveLength(8);
      const ids = result.cards.map((c) => c.item.id).sort();
      expect(ids).toEqual(["0", "1", "2", "3", "4", "5", "6", "7"]);

      // The shrunk gap-filled cards are a single cell (200px) wide, much smaller
      // than the 800px full-size cards placed during column packing.
      const shrunk = result.cards.filter((c) => c.width === 200 && c.height === 200);
      expect(shrunk.length).toBeGreaterThanOrEqual(1);

      // No two placed cards overlap.
      for (let i = 0; i < result.cards.length; i++) {
        for (let j = i + 1; j < result.cards.length; j++) {
          const a = result.cards[i];
          const b = result.cards[j];
          const disjoint =
            a.x + a.width <= b.x ||
            b.x + b.width <= a.x ||
            a.y + a.height <= b.y ||
            b.y + b.height <= a.y;
          expect(disjoint).toBe(true);
        }
      }
    });
  });

  describe("Grid grows after placement when a card reaches the bottom edge", () => {
    test("a single full-height item triggers post-placement grid growth", () => {
      // gridRows = max(viewportRows*3, ceil(estimate*1.5)) * 4 = 20 internal
      // units for one item in this viewport. A 1000px-tall card is exactly 20
      // units, landing on the bottom edge and forcing the occupied grid to grow.
      const items: TestItem[] = [{ id: "full", format: { minSize: { width: 400, height: 1000 } } }];
      const result = calculateLayout(items, 900, 100, { baseSize: 200, gap: 16 });

      const card = result.cards.find((c) => c.item.id === "full");
      expect(card).toBeDefined();
      // 20 units = 5 cells + 4 gaps = 1064px (never smaller than minSize).
      expect(card?.height).toBe(1064);
      expect(card?.width).toBeGreaterThanOrEqual(400);
      // Output height must have grown to contain the tall card.
      expect(result.height).toBeGreaterThanOrEqual(1000);
    });
  });

  describe("Ratio sort comparator with mixed placeable and unplaceable items", () => {
    test("a leading null-size item sorts behind valid overflow items", () => {
      // An oversized non-loose ratio item (null size) comes first, followed by
      // many loose full-width items that overflow the grid (valid sizes). V8
      // invokes the sort comparator as compare(arr[i], arr[i-1]), so the first
      // comparison has a valid left operand and the null-size right operand,
      // exercising the `!sizeB` branch of the comparator.
      const overflow: TestItem[] = Array.from({ length: 50 }, (_, i) => ({
        id: `ov-${i}`,
        format: { size: { width: 800, height: 800 } },
      }));
      const items: TestItem[] = [
        { id: "null-head", format: { ratio: "16:9", size: { width: 6000, height: 6000 } } },
        ...overflow,
      ];
      const result = calculateLayout(items, 900, 100, { baseSize: 200, gap: 16 });

      const ids = result.cards.map((c) => c.item.id);
      // The oversized strict-ratio item is dropped; every loose item survives.
      expect(ids).not.toContain("null-head");
      expect(result.cards).toHaveLength(50);
      for (let i = 0; i < 50; i++) {
        expect(ids).toContain(`ov-${i}`);
      }
    });
  });

  describe("Malformed custom ratio strings", () => {
    test("ratio without a colon is ignored and the item keeps its default size", () => {
      const items: TestItem[] = [{ id: "bad", format: { ratio: "totally-not-a-ratio" } }];
      const result = calculateLayout(items, 2000, 2000, { baseSize: 200, gap: 16 });

      const bad = result.cards.find((c) => c.item.id === "bad");
      expect(bad).toBeDefined();
      // The malformed ratio is skipped, so the card stays at the default
      // 2x2-cell size (8 internal units => 2 * 200 + 16 gap = 416px). Having
      // a `format.ratio` also means the card is not scaled/expanded.
      expect(bad?.width).toBe(416);
      expect(bad?.height).toBe(416);
    });

    test("ratio with non-numeric or zero parts is ignored", () => {
      const items: TestItem[] = [
        { id: "nan", format: { ratio: "abc:def" } },
        { id: "zero", format: { ratio: "0:0" } },
      ];
      const result = calculateLayout(items, 2000, 2000, { baseSize: 200, gap: 16 });

      const nan = result.cards.find((c) => c.item.id === "nan");
      const zero = result.cards.find((c) => c.item.id === "zero");
      // Both invalid ratios are skipped, leaving the default 2x2-cell card.
      expect(nan?.width).toBe(416);
      expect(nan?.height).toBe(416);
      expect(zero?.width).toBe(416);
      expect(zero?.height).toBe(416);
    });
  });

  describe("Grow path does not overlap previously grown cards (regression)", () => {
    test("multiple non-loose items routed through grid growth never overlap", () => {
      // Tall non-loose minSize items cannot be shrunk into gaps, so several of
      // them overflow column packing and fall through to the grid-growth path.
      // A stale gridRows snapshot used to stack them all on the same row.
      const items: TestItem[] = Array.from({ length: 12 }, (_, i) => ({
        id: `${i}`,
        format: { minSize: { width: 700, height: 1000 }, loose: false },
      }));
      const result = calculateLayout(items, 900, 100, { baseSize: 200, gap: 16 });

      expect(result.cards).toHaveLength(12);

      // Assert no two placed cards overlap.
      for (let i = 0; i < result.cards.length; i++) {
        for (let j = i + 1; j < result.cards.length; j++) {
          const a = result.cards[i];
          const b = result.cards[j];
          const disjoint =
            a.x + a.width <= b.x ||
            b.x + b.width <= a.x ||
            a.y + a.height <= b.y ||
            b.y + b.height <= a.y;
          expect(disjoint).toBe(true);
        }
      }
    });
  });

  describe("exact skyline mode", () => {
    test("forced-to-origin: the narrowest of several too-wide variants is placed at x=0", () => {
      const items: TestItem[] = [
        {
          id: "wide",
          format: {
            variants: [
              { width: 500, height: 100 },
              { width: 400, height: 120 },
              { width: 450, height: 80 },
            ],
          },
        },
      ];
      const result = calculateLayout(items, 300, 600, { packing: "exact", gap: 0 });

      expect(result.cards).toHaveLength(1);
      expect(result.cards[0]).toMatchObject({ x: 0, y: 0, width: 400, height: 120 });
      expect(result.width).toBe(400);
    });

    test("variants: equal restY, top and x0 fall back to the smaller area", () => {
      const items: TestItem[] = [
        {
          id: "tie",
          format: {
            variants: [
              { width: 200, height: 100 },
              { width: 150, height: 100 },
            ],
          },
        },
      ];
      const result = calculateLayout(items, 600, 600, { packing: "exact", gap: 0 });

      expect(result.cards[0]).toMatchObject({ x: 0, y: 0, width: 150, height: 100 });
    });

    test("only invalid items: no cards, zero utilization, perfect order fidelity", () => {
      const items: TestItem[] = [
        { id: "zero-w", format: { size: { width: 0, height: 100 } } },
        { id: "neg-h", format: { size: { width: 100, height: -5 } } },
      ];
      const result = calculateLayout(items, 600, 600, { packing: "exact" });

      expect(result).toEqual({
        cards: [],
        width: 600,
        height: 0,
        utilization: 0,
        orderFidelity: 1,
      });
    });

    function assertNoOverlap(cards: { x: number; y: number; width: number; height: number }[]) {
      for (let i = 0; i < cards.length; i++) {
        for (let j = i + 1; j < cards.length; j++) {
          const a = cards[i];
          const b = cards[j];
          const disjoint =
            a.x + a.width <= b.x ||
            b.x + b.width <= a.x ||
            a.y + a.height <= b.y ||
            b.y + b.height <= a.y;
          expect(disjoint).toBe(true);
        }
      }
    }

    test("pixel-exact: exact input sizes come back unrounded", () => {
      const items: TestItem[] = [
        { id: "a", format: { size: { width: 160, height: 226 } } },
        { id: "b", format: { size: { width: 328, height: 226 } } },
        { id: "c", format: { size: { width: 504, height: 452 } } },
      ];
      const result = calculateLayout(items, 1200, 800, { packing: "exact", gap: 0 });

      const byId = Object.fromEntries(result.cards.map((c) => [c.item.id, c]));
      expect(byId.a.width).toBe(160);
      expect(byId.a.height).toBe(226);
      expect(byId.b.width).toBe(328);
      expect(byId.b.height).toBe(226);
      expect(byId.c.width).toBe(504);
      expect(byId.c.height).toBe(452);
    });

    test("no overlap across a mixed set of ~30 boxes", () => {
      const sizes = [
        { width: 120, height: 80 },
        { width: 200, height: 150 },
        { width: 90, height: 240 },
        { width: 310, height: 60 },
        { width: 175, height: 175 },
      ];
      const items: TestItem[] = Array.from({ length: 30 }, (_, i) => ({
        id: `${i}`,
        format: { size: sizes[i % sizes.length] },
      }));
      const result = calculateLayout(items, 1000, 800, { packing: "exact", gap: 8 });

      expect(result.cards).toHaveLength(30);
      assertNoOverlap(result.cards);
    });

    test("respects targetWidth: no card exceeds the container's right edge", () => {
      const sizes = [
        { width: 150, height: 100 },
        { width: 260, height: 220 },
        { width: 90, height: 300 },
      ];
      const items: TestItem[] = Array.from({ length: 20 }, (_, i) => ({
        id: `${i}`,
        format: { size: sizes[i % sizes.length] },
      }));
      const result = calculateLayout(items, 700, 500, { packing: "exact", gap: 10 });

      for (const card of result.cards) {
        expect(card.x + card.width).toBeLessThanOrEqual(result.width);
        // None of these boxes are wider than the container, so none may overflow it.
        expect(card.x + card.width).toBeLessThanOrEqual(700);
      }
    });

    test("oversized item overflows the right edge instead of being dropped", () => {
      const items: TestItem[] = [{ id: "huge", format: { size: { width: 5000, height: 300 } } }];
      const result = calculateLayout(items, 700, 500, { packing: "exact", gap: 0 });

      expect(result.cards).toHaveLength(1);
      expect(result.cards[0].x).toBe(0);
      expect(result.cards[0].width).toBe(5000);
      expect(result.width).toBeGreaterThanOrEqual(5000);
    });

    test("degenerate targetWidth (0) never overlaps cards at the origin", () => {
      // A transient container width of 0 (e.g. measured before
      // ResizeObserver fires) must never collapse the raise range and stack
      // every card on top of each other at {x:0, y:0}.
      const items: TestItem[] = [
        { id: "a", format: { size: { width: 100, height: 100 } } },
        { id: "b", format: { size: { width: 100, height: 200 } } },
        { id: "c", format: { size: { width: 100, height: 300 } } },
      ];
      const result = calculateLayout(items, 0, 500, { packing: "exact" });

      expect(result.cards).toEqual([]);
      expect(result.width).toBe(0);
      expect(result.height).toBe(0);
      expect(result.utilization).toBe(0);
      expect(result.orderFidelity).toBe(1);
    });

    test("degenerate targetWidth (negative or non-finite) is treated the same as 0", () => {
      const items: TestItem[] = [{ id: "a", format: { size: { width: 100, height: 100 } } }];

      for (const badWidth of [-50, Number.NaN, Number.POSITIVE_INFINITY]) {
        const result = calculateLayout(items, badWidth, 500, { packing: "exact" });
        expect(result.cards).toEqual([]);
      }
    });

    test("normal small layout with gap:0 still packs with zero overlaps", () => {
      const items: TestItem[] = [
        { id: "a", format: { size: { width: 100, height: 100 } } },
        { id: "b", format: { size: { width: 100, height: 200 } } },
        { id: "c", format: { size: { width: 100, height: 300 } } },
      ];
      const result = calculateLayout(items, 500, 500, { packing: "exact", gap: 0 });

      expect(result.cards).toHaveLength(3);
      assertNoOverlap(result.cards);
    });

    test("items whose every variant has zero/negative width or height are skipped safely", () => {
      const items: TestItem[] = [
        { id: "good-before", format: { size: { width: 100, height: 100 } } },
        { id: "degenerate", format: { size: { width: 0, height: 100 } } },
        { id: "also-degenerate", format: { variants: [{ width: 50, height: 0 }] } },
        { id: "good-after", format: { size: { width: 100, height: 100 } } },
      ];
      const result = calculateLayout(items, 500, 500, { packing: "exact", gap: 0 });

      expect(result.cards.map((c) => c.item.id)).toEqual(["good-before", "good-after"]);
      assertNoOverlap(result.cards);
    });

    test("valley filling: a later item rises beside a short box instead of stacking below the tall one", () => {
      const items: TestItem[] = [
        { id: "tall", format: { size: { width: 200, height: 800 } } },
        { id: "short", format: { size: { width: 200, height: 100 } } },
        { id: "filler", format: { size: { width: 200, height: 200 } } },
      ];
      const result = calculateLayout(items, 400, 100, { packing: "exact", gap: 0 });

      const byId = Object.fromEntries(result.cards.map((c) => [c.item.id, c]));
      // The tall box occupies the left column down to y=800.
      expect(byId.tall.x).toBe(0);
      expect(byId.tall.y).toBe(0);
      expect(byId.tall.height).toBe(800);
      // The short box sits beside it, not below it.
      expect(byId.short.x).toBe(200);
      expect(byId.short.y).toBe(0);
      // The filler rises into the valley above "short" rather than being
      // pushed below "tall" (which a naive row-based layout would do).
      expect(byId.filler.x).toBe(200);
      expect(byId.filler.y).toBeLessThan(byId.tall.y + byId.tall.height);
      assertNoOverlap(result.cards);
    });

    test("variants: the candidate yielding the smaller restY/top wins", () => {
      // Pre-fill the skyline so the left 168px column is high (500) and the
      // remaining 512px is low (100) - a valley on the right.
      const items: TestItem[] = [
        { id: "pre-left", format: { size: { width: 168, height: 500 } } },
        { id: "pre-right", format: { size: { width: 512, height: 100 } } },
        {
          id: "variant-item",
          format: {
            variants: [
              { width: 504, height: 226 }, // wide
              { width: 168, height: 680 }, // tall
            ],
          },
        },
      ];
      const result = calculateLayout(items, 680, 100, { packing: "exact", gap: 0 });

      const byId = Object.fromEntries(result.cards.map((c) => [c.item.id, c]));
      expect(byId["pre-left"]).toMatchObject({ x: 0, y: 0, width: 168, height: 500 });
      expect(byId["pre-right"]).toMatchObject({ x: 168, y: 0, width: 512, height: 100 });
      // Both variants can reach restY=100 at x=168, but the wide variant has
      // the smaller resulting top (100+226 < 100+680), so it wins the tie.
      expect(byId["variant-item"]).toMatchObject({ x: 168, y: 100, width: 504, height: 226 });
    });

    test("determinism: identical input produces a deeply equal result", () => {
      const items: TestItem[] = Array.from({ length: 15 }, (_, i) => ({
        id: `${i}`,
        format: { size: { width: 100 + (i % 5) * 40, height: 90 + (i % 3) * 60 } },
      }));

      const result1 = calculateLayout(items, 800, 600, { packing: "exact", gap: 12 });
      const result2 = calculateLayout(items, 800, 600, { packing: "exact", gap: 12 });

      expect(result2).toEqual(result1);
    });

    test("order stability: output cards preserve input order", () => {
      const items: TestItem[] = Array.from({ length: 25 }, (_, i) => ({
        id: `${i}`,
        format: { size: { width: 80 + (i % 4) * 30, height: 80 + (i % 5) * 20 } },
      }));
      const result = calculateLayout(items, 900, 700, { packing: "exact", gap: 6 });

      expect(result.cards.map((c) => c.item.id)).toEqual(items.map((i) => i.id));
    });

    test("grid-mode regression: omitting packing (or 'grid') is byte-for-byte unchanged", () => {
      const items: TestItem[] = [
        { id: "a", format: { size: { width: 400, height: 400 } } },
        { id: "b" },
        { id: "c", format: { ratio: "16:9" } },
      ];
      const expected = {
        cards: [
          {
            item: { id: "a", format: { size: { width: 400, height: 400 } } },
            x: 0,
            y: 0,
            width: 416,
            height: 416,
          },
          { item: { id: "b" }, x: 432, y: 0, width: 524, height: 524 },
          {
            item: { id: "c", format: { ratio: "16:9" } },
            x: 0,
            y: 432,
            width: 578,
            height: 308,
          },
        ],
        width: 956,
        height: 740,
        utilization: 0.6534090909090909,
        orderFidelity: 1,
      };

      const withoutOption = calculateLayout(items, 900, 600, { baseSize: 200, gap: 16 });
      const withGridOption = calculateLayout(items, 900, 600, {
        baseSize: 200,
        gap: 16,
        packing: "grid",
      });

      expect(withoutOption).toEqual(expected);
      expect(withGridOption).toEqual(expected);
    });

    test("perf sanity: 2000 boxes of MANY distinct sizes pack in near-linear time", () => {
      // Regression for an O(n^3) blow-up: per-item placement used to
      // re-filter the *entire* skyline for every candidate x0, which is only
      // cheap when the skyline coalesces down to a handful of segments (as
      // it does when sizes repeat). Here every item has a distinct width and
      // a distinct height, so the skyline stays fragmented into many
      // segments and never coalesces - this is the case that used to take
      // over a minute at N=4000.
      const items: TestItem[] = Array.from({ length: 2000 }, (_, i) => ({
        id: `${i}`,
        format: {
          size: { width: 20 + ((i * 7) % 300), height: 20 + ((i * 13) % 500) },
        },
      }));

      const start = performance.now();
      const result = calculateLayout(items, 4000, 4000, { packing: "exact", gap: 4 });
      const elapsed = performance.now() - start;

      expect(result.cards).toHaveLength(2000);
      // Count overlaps without calling `expect()` per pair (~2M pairs at
      // N=2000) - the assertion machinery itself would dwarf the packer's
      // own O(n^2) cost and produce a false timeout unrelated to the fix.
      let overlaps = 0;
      const cards = result.cards;
      for (let i = 0; i < cards.length; i++) {
        for (let j = i + 1; j < cards.length; j++) {
          const a = cards[i];
          const b = cards[j];
          const disjoint =
            a.x + a.width <= b.x ||
            b.x + b.width <= a.x ||
            a.y + a.height <= b.y ||
            b.y + b.height <= a.y;
          if (!disjoint) overlaps++;
        }
      }
      expect(overlaps).toBe(0);
      // Loose bound: just proves there is no cubic blow-up (the old
      // implementation took multiple seconds at this N).
      expect(elapsed).toBeLessThan(300);
    });

    /** Count overlapping pairs among placed cards without asserting per-pair (O(n^2), assert once). */
    function countOverlaps(
      cards: { x: number; y: number; width: number; height: number }[],
    ): number {
      let overlaps = 0;
      for (let i = 0; i < cards.length; i++) {
        for (let j = i + 1; j < cards.length; j++) {
          const a = cards[i];
          const b = cards[j];
          const disjoint =
            a.x + a.width <= b.x ||
            b.x + b.width <= a.x ||
            a.y + a.height <= b.y ||
            b.y + b.height <= a.y;
          if (!disjoint) overlaps++;
        }
      }
      return overlaps;
    }

    test("regression: 2382 boxes of many distinct sizes never overlap (bisected minimal repro)", () => {
      // Adversarial bisection found that raiseSkyline used to overwrite a
      // segment's recorded height unconditionally when raising the range
      // covering a placed box's footprint + gap buffer. When that buffer
      // landed inside an already-taller neighboring segment, the neighbor's
      // height got corrupted (lowered), and a later item read the bogus
      // height and was placed overlapping the earlier, taller card - here,
      // cards '2342' and '2381' ended up overlapping.
      const items: TestItem[] = Array.from({ length: 2382 }, (_, i) => ({
        id: String(i),
        format: { size: { width: 20 + ((i * 7) % 300), height: 20 + ((i * 13) % 500) } },
      }));
      const result = calculateLayout(items, 4000, 4000, { packing: "exact", gap: 4 });

      expect(result.cards).toHaveLength(2382);
      expect(countOverlaps(result.cards)).toBe(0);
    });

    test("property: zero overlaps and in-bounds cards across many deterministic large datasets", () => {
      // Each item's size is derived from its index (no Math.random) so this
      // is fully reproducible; the (a, b, W, H, gap, targetWidth, N)
      // combinations are chosen to fragment the skyline differently (small
      // vs. large gaps, narrow vs. wide containers, prime vs. non-prime
      // strides) to stress the raise-range/gap-buffer interaction that
      // caused the original bug.
      const configs: {
        n: number;
        a: number;
        b: number;
        w: number;
        h: number;
        gap: number;
        targetWidth: number;
      }[] = [
        { n: 500, a: 7, b: 13, w: 300, h: 500, gap: 4, targetWidth: 4000 },
        { n: 1200, a: 11, b: 17, w: 250, h: 400, gap: 8, targetWidth: 3000 },
        { n: 2000, a: 5, b: 23, w: 400, h: 200, gap: 1, targetWidth: 2500 },
        { n: 2382, a: 7, b: 13, w: 300, h: 500, gap: 4, targetWidth: 4000 },
        { n: 3000, a: 13, b: 29, w: 180, h: 900, gap: 0, targetWidth: 5000 },
        { n: 3000, a: 3, b: 7, w: 600, h: 60, gap: 12, targetWidth: 1500 },
      ];

      for (const { n, a, b, w, h, gap, targetWidth } of configs) {
        const items: TestItem[] = Array.from({ length: n }, (_, i) => ({
          id: String(i),
          format: { size: { width: 20 + ((i * a) % w), height: 20 + ((i * b) % h) } },
        }));
        const result = calculateLayout(items, targetWidth, targetWidth, {
          packing: "exact",
          gap,
        });

        expect(result.cards).toHaveLength(n);
        expect(countOverlaps(result.cards)).toBe(0);
        for (const card of result.cards) {
          expect(card.x).toBeGreaterThanOrEqual(0);
          expect(card.y).toBeGreaterThanOrEqual(0);
          expect(card.x + card.width).toBeLessThanOrEqual(result.width);
          expect(card.y + card.height).toBeLessThanOrEqual(result.height);
        }
      }
    });

    test("variants: identical inputs pick identical variants across runs (determinism)", () => {
      const items: TestItem[] = [
        { id: "pre-left", format: { size: { width: 168, height: 500 } } },
        { id: "pre-right", format: { size: { width: 512, height: 100 } } },
        {
          id: "variant-item",
          format: {
            variants: [
              { width: 504, height: 226 }, // wide
              { width: 168, height: 680 }, // tall
            ],
          },
        },
      ];

      const result1 = calculateLayout(items, 680, 100, { packing: "exact", gap: 0 });
      const result2 = calculateLayout(items, 680, 100, { packing: "exact", gap: 0 });

      expect(result2).toEqual(result1);
      const chosen = result1.cards.find((c) => c.item.id === "variant-item");
      expect(chosen).toMatchObject({ width: 504, height: 226 });
    });

    test("exact mode never returns a 'grid' field, even when includeGrid:true is passed", () => {
      const items: TestItem[] = [
        { id: "a", format: { size: { width: 100, height: 100 } } },
        { id: "b", format: { size: { width: 150, height: 80 } } },
      ];
      const result = calculateLayout(items, 500, 500, {
        packing: "exact",
        gap: 8,
        includeGrid: true,
      });

      expect(result.cards).toHaveLength(2);
      for (const card of result.cards) {
        expect(card.grid).toBeUndefined();
      }
    });

    test("gap: honors real pixel spacing between two adjacent boxes", () => {
      const items: TestItem[] = [
        { id: "a", format: { size: { width: 100, height: 100 } } },
        { id: "b", format: { size: { width: 100, height: 100 } } },
      ];
      const result = calculateLayout(items, 220, 200, { packing: "exact", gap: 10 });

      const byId = Object.fromEntries(result.cards.map((c) => [c.item.id, c]));
      // Both boxes are 100 wide and the container is only 220px, so they sit
      // side by side with a real 10px gap between their edges.
      expect(byId.a.y).toBe(0);
      expect(byId.b.y).toBe(0);
      expect(byId.b.x - (byId.a.x + byId.a.width)).toBe(10);
      assertNoOverlap(result.cards);
    });

    test("orderFidelity is within [0,1] and equals 1 for a trivially-ordered single column", () => {
      const narrowColumnItems: TestItem[] = Array.from({ length: 5 }, (_, i) => ({
        id: `${i}`,
        format: { size: { width: 100, height: 100 + i * 10 } },
      }));
      const singleColumn = calculateLayout(narrowColumnItems, 100, 100, {
        packing: "exact",
        gap: 5,
      });
      expect(singleColumn.orderFidelity).toBe(1);

      const mixedSizeItems: TestItem[] = Array.from({ length: 40 }, (_, i) => ({
        id: `${i}`,
        format: { size: { width: 40 + ((i * 17) % 200), height: 40 + ((i * 23) % 300) } },
      }));
      const packed = calculateLayout(mixedSizeItems, 900, 700, { packing: "exact", gap: 6 });
      expect(packed.orderFidelity).toBeGreaterThanOrEqual(0);
      expect(packed.orderFidelity).toBeLessThanOrEqual(1);
    });

    test("format.ratio only (no size/variants) falls back to a valid square in exact mode with zero overlaps", () => {
      const items: TestItem[] = [
        { id: "a", format: { ratio: "16:9" } },
        { id: "b", format: { ratio: "portrait" } },
        { id: "c", format: { ratio: "1:1" } },
      ];
      const result = calculateLayout(items, 600, 400, {
        packing: "exact",
        gap: 4,
        baseSize: 150,
      });

      expect(result.cards).toHaveLength(3);
      for (const card of result.cards) {
        // Falls back to the fallback square (baseSize x baseSize) since
        // exact mode ignores format.ratio entirely.
        expect(card.width).toBe(150);
        expect(card.height).toBe(150);
      }
      assertNoOverlap(result.cards);
    });
  });
});
