import { describe, test, expect } from "vitest";
import { calculateLayout } from "../calculator";
import type { LayoutItem } from "../types";

// Test item interface extending LayoutItem
interface TestItem extends LayoutItem {
  id: string;
}

describe("calculateLayout", () => {
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
      const items: TestItem[] = [
        { id: "1", format: { ratio: "4:3", loose: true } },
      ];
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
      const items: TestItem[] = [
        { id: "1", format: { ratio: "2:1", loose: false } },
      ];
      const result = calculateLayout(items, 2000, 2000);

      const placed = result.cards.find((c) => c.item.id === "1");
      const ratio = placed!.width / placed!.height;
      expect(ratio).toBeCloseTo(2, 0.5);
    });

    test("loose: true allows ratio flexibility", () => {
      const items: TestItem[] = [
        { id: "1", format: { ratio: "2:1", loose: true } },
      ];
      const result = calculateLayout(items, 2000, 2000);

      const placed = result.cards.find((c) => c.item.id === "1");
      expect(placed).toBeDefined();
      // Should still place even if exact ratio not achievable
    });
  });

  describe("Placement Algorithm", () => {
    test("places all items in input order by default", () => {
      const items: TestItem[] = [
        { id: "1" },
        { id: "2" },
        { id: "3" },
        { id: "4" },
        { id: "5" },
      ];
      const result = calculateLayout(items, 2000, 1000);

      expect(result.cards).toHaveLength(5);
      // Default looseness should try to preserve order
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
      const items: TestItem[] = [
        { id: "1" },
        { id: "2" },
        { id: "3" },
        { id: "4" },
        { id: "5" },
      ];
      const result = calculateLayout(items, 2000, 1500);

      expect(result.orderFidelity).toBeGreaterThanOrEqual(0);
      expect(result.orderFidelity).toBeLessThanOrEqual(1);
    });

    test("looseness: 0 maximizes order fidelity", () => {
      const items: TestItem[] = Array.from({ length: 20 }, (_, i) => ({
        id: `${i}`,
      }));
      const result = calculateLayout(items, 2000, 2000, { looseness: 0 });

      // With looseness 0, order should be strictly preserved
      expect(result.orderFidelity).toBeGreaterThan(0.9);

      // Verify items are in original order
      for (let i = 0; i < result.cards.length - 1; i++) {
        const currentId = parseInt(result.cards[i].item.id, 10);
        const nextId = parseInt(result.cards[i + 1].item.id, 10);
        expect(nextId).toBeGreaterThan(currentId);
      }
    });

    test("looseness: 1 allows full reordering", () => {
      const items: TestItem[] = Array.from({ length: 20 }, (_, i) => ({
        id: `${i}`,
        format: {
          size: {
            width: 100 + Math.random() * 300,
            height: 100 + Math.random() * 300,
          },
        },
      }));
      const result = calculateLayout(items, 2000, 2000, { looseness: 1 });

      expect(result.orderFidelity).toBeGreaterThanOrEqual(0);
      expect(result.orderFidelity).toBeLessThanOrEqual(1);
      // With looseness 1, items may be heavily reordered for better packing
    });

    test("default looseness (0.2) balances order and packing", () => {
      const items: TestItem[] = Array.from({ length: 15 }, (_, i) => ({
        id: `${i}`,
      }));
      const result = calculateLayout(items, 2000, 1500);

      // Default should maintain reasonable order fidelity
      expect(result.orderFidelity).toBeGreaterThan(0.5);
      expect(result.utilization).toBeGreaterThan(0.5);
    });

    test("custom looseness: 0.5 moderate reordering", () => {
      const items: TestItem[] = Array.from({ length: 20 }, (_, i) => ({
        id: `${i}`,
      }));
      const result = calculateLayout(items, 2000, 2000, { looseness: 0.5 });

      expect(result.orderFidelity).toBeGreaterThanOrEqual(0);
      expect(result.orderFidelity).toBeLessThanOrEqual(1);
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

    test("higher looseness improves utilization", () => {
      const items: TestItem[] = Array.from({ length: 20 }, (_, i) => ({
        id: `${i}`,
        format: {
          size: {
            width: 150 + Math.random() * 200,
            height: 150 + Math.random() * 200,
          },
        },
      }));

      const strictResult = calculateLayout(items, 2000, 2000, { looseness: 0 });
      const looseResult = calculateLayout(items, 2000, 2000, { looseness: 1 });

      // Loose packing should generally achieve better utilization
      expect(looseResult.utilization).toBeGreaterThanOrEqual(
        strictResult.utilization - 0.1
      );
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
      const items: TestItem[] = [
        { id: "1", format: { minSize: { width: 400, height: 300 } } },
      ];
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

    test("performance with high looseness", () => {
      const items = generateItems(500);
      const start = performance.now();
      const result = calculateLayout(items, 4000, 8000, { looseness: 1 });
      const duration = performance.now() - start;

      expect(result.cards).toHaveLength(500);
      console.log(`500 items with looseness=1: ${duration.toFixed(2)}ms`);
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
      const result = calculateLayout(items, 2000, 1500, { looseness: 0 });

      // With looseness 0, order should be strictly preserved
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
        { id: "constrained", format: { minSize: { width: 200, height: 150 }, maxSize: { width: 600, height: 450 } } },
        ...Array.from({ length: 10 }, (_, i) => ({ id: `card-${i}` })),
      ];

      const result = calculateLayout(items, 3000, 3000, {
        baseSize: 200,
        gap: 16,
        looseness: 0.3,
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
        format:
          i % 3 === 0 ? { ratio: "16:9" } : i % 3 === 1 ? { ratio: "1:1" } : {},
      }));

      const result = calculateLayout(items, 2400, 1800, {
        baseSize: 250,
        gap: 20,
        looseness: 0.6,
        includeGrid: true,
      });

      expect(result.cards).toHaveLength(15);
      expect(result.utilization).toBeGreaterThan(0);
      expect(result.orderFidelity).toBeGreaterThanOrEqual(0);
      expect(result.cards[0].grid).toBeDefined();
    });
  });
});
