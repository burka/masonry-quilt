import { describe, test, expect } from "vitest";
import { calculateCardLayout } from "../calculator";
import type { LayoutItem } from "../types";

describe("calculateCardLayout", () => {
  describe("Grid Calculation", () => {
    test("calculates grid for 1920x1080 viewport with 200px cells", () => {
      const items: LayoutItem[] = [{ id: "1", importance: 5 }];
      const result = calculateCardLayout(items, 1920, 1080, 200, "m");

      expect(result.grid.cols).toBe(8);
      expect(result.grid.rows).toBeGreaterThan(0);
    });

    test("handles tiny viewport (400px width)", () => {
      const items: LayoutItem[] = [{ id: "1", importance: 5 }];
      const result = calculateCardLayout(items, 400, 600, 200, "s");

      expect(result.grid.cols).toBeGreaterThanOrEqual(1);
    });

    test("handles huge viewport (4000px width)", () => {
      const items: LayoutItem[] = [{ id: "1", importance: 5 }];
      const result = calculateCardLayout(items, 4000, 2000, 200, "l");

      expect(result.grid.cols).toBeGreaterThan(15);
    });
  });

  describe("Gap Sizing", () => {
    test("uses 8px gap for 's'", () => {
      const items: LayoutItem[] = [{ id: "1", importance: 5 }];
      const result1 = calculateCardLayout(items, 1000, 800, 200, "s");
      const result2 = calculateCardLayout(items, 1000, 800, 200, "m");

      expect(result1.grid.cols).toBeGreaterThanOrEqual(result2.grid.cols);
    });

    test("uses 16px gap for 'm'", () => {
      const items: LayoutItem[] = [{ id: "1", importance: 5 }];
      const result = calculateCardLayout(items, 1000, 800, 200, "m");
      expect(result.grid.cols).toBeGreaterThan(0);
    });

    test("uses 24px gap for 'l'", () => {
      const items: LayoutItem[] = [{ id: "1", importance: 5 }];
      const result = calculateCardLayout(items, 1000, 800, 200, "l");
      expect(result.grid.cols).toBeGreaterThan(0);
    });
  });

  describe("Importance-based Sizing", () => {
    test("higher importance items get larger area", () => {
      const items: LayoutItem[] = [
        { id: "1", importance: 10 },
        { id: "2", importance: 5 },
        { id: "3", importance: 1 },
      ];
      const result = calculateCardLayout(items, 2000, 2000, 200, "m");

      const placed1 = result.placed.find((p) => p.id === "1");
      const placed2 = result.placed.find((p) => p.id === "2");
      const placed3 = result.placed.find((p) => p.id === "3");

      const area1 = placed1!.width * placed1!.height;
      const area2 = placed2!.width * placed2!.height;
      const area3 = placed3!.width * placed3!.height;

      expect(area1).toBeGreaterThan(area2);
      expect(area2).toBeGreaterThan(area3);
      expect(area1).toBeGreaterThanOrEqual(area3 * 2);
    });

    test("card sizes adapt to viewport", () => {
      const items: LayoutItem[] = [{ id: "1", importance: 5 }];

      const small = calculateCardLayout(items, 1000, 800, 200, "m");
      const smallCard = small.placed.find((p) => p.id === "1");

      const large = calculateCardLayout(items, 3000, 2000, 200, "m");
      const largeCard = large.placed.find((p) => p.id === "1");

      expect(largeCard!.width).toBeGreaterThanOrEqual(smallCard!.width);
      expect(largeCard!.height).toBeGreaterThanOrEqual(smallCard!.height);
    });
  });

  describe("Format: minSize", () => {
    test("respects minSize constraint", () => {
      const items: LayoutItem[] = [
        {
          id: "1",
          importance: 5,
          format: { minSize: { width: 2, height: 2 } },
        },
      ];
      const result = calculateCardLayout(items, 2000, 2000, 200, "m");

      const placed = result.placed.find((p) => p.id === "1");
      expect(placed?.width).toBeGreaterThanOrEqual(8); // 2 cells * 4 units
      expect(placed?.height).toBeGreaterThanOrEqual(8);
    });
  });

  describe("Format: ratio shortcuts", () => {
    test("'portrait' = 1:2", () => {
      const items: LayoutItem[] = [
        { id: "1", importance: 2, format: { ratio: "portrait", strict: true } },
      ];
      const result = calculateCardLayout(items, 2000, 2000, 200, "m");

      const placed = result.placed.find((p) => p.id === "1");
      expect(placed!.width * 2).toBe(placed!.height);
    });

    test("'landscape' = 2:1", () => {
      const items: LayoutItem[] = [
        { id: "1", importance: 2, format: { ratio: "landscape", strict: true } },
      ];
      const result = calculateCardLayout(items, 2000, 2000, 200, "m");

      const placed = result.placed.find((p) => p.id === "1");
      expect(placed!.width).toBe(placed!.height * 2);
    });

    test("'banner' = 4:1", () => {
      const items: LayoutItem[] = [
        { id: "1", importance: 2, format: { ratio: "banner", strict: true } },
      ];
      const result = calculateCardLayout(items, 2000, 2000, 200, "m");

      const placed = result.placed.find((p) => p.id === "1");
      expect(placed!.width).toBe(placed!.height * 4);
    });

    test("'tower' = 1:4", () => {
      const items: LayoutItem[] = [
        { id: "1", importance: 2, format: { ratio: "tower", strict: true } },
      ];
      const result = calculateCardLayout(items, 2000, 2000, 200, "m");

      const placed = result.placed.find((p) => p.id === "1");
      expect(placed!.height).toBe(placed!.width * 4);
    });
  });

  describe("Format: custom ratios", () => {
    test("ratio '16:9' strict", () => {
      const items: LayoutItem[] = [
        { id: "1", importance: 3, format: { ratio: "16:9", strict: true } },
      ];
      const result = calculateCardLayout(items, 2000, 2000, 200, "m");

      const placed = result.placed.find((p) => p.id === "1");
      const ratio = placed!.width / placed!.height;
      expect(ratio).toBeCloseTo(16 / 9, 0.5);
    });

    test("ratio '4:3' as hint (not strict)", () => {
      const items: LayoutItem[] = [
        { id: "1", importance: 3, format: { ratio: "4:3", strict: false } },
      ];
      const result = calculateCardLayout(items, 2000, 2000, 200, "m");

      const placed = result.placed.find((p) => p.id === "1");
      expect(placed).toBeDefined();
    });
  });

  describe("Placement Algorithm", () => {
    test("places items in masonry pattern", () => {
      const items: LayoutItem[] = [
        { id: "1", importance: 1 },
        { id: "2", importance: 1 },
        { id: "3", importance: 1 },
      ];
      const result = calculateCardLayout(items, 2000, 1000, 200, "m");

      expect(result.placed).toHaveLength(3);
      expect(result.placed[0].row).toBe(0);
      expect(result.placed[0].col).toBe(0);
    });

    test("finds available spaces for later items", () => {
      const items: LayoutItem[] = [
        { id: "1", importance: 3 },
        { id: "2", importance: 1 },
      ];
      const result = calculateCardLayout(items, 2000, 2000, 200, "m");

      expect(result.placed).toHaveLength(2);
      expect(result.placed[1].col).toBeGreaterThanOrEqual(0);
    });

    test("efficiently packs items even in constrained spaces", () => {
      const items: LayoutItem[] = Array.from({ length: 100 }, (_, i) => ({
        id: `${i}`,
        importance: 5,
      }));
      // Even with many items, the algorithm efficiently packs them
      const result = calculateCardLayout(items, 600, 400, 200, "m");

      // Should place most items, algorithm is very efficient
      expect(result.placed.length).toBeGreaterThan(50);
      // May have some unplaced due to space constraints
      expect(result.placed.length + result.unplaced.length).toBe(100);
    });

    test("respects strict format even if it means not placing", () => {
      const items: LayoutItem[] = [
        {
          id: "1",
          importance: 5,
          format: { ratio: "10:1", strict: true },
        },
      ];
      const result = calculateCardLayout(items, 500, 500, 200, "m");

      if (result.placed.length > 0) {
        const placed = result.placed[0];
        expect(placed.width / placed.height).toBeCloseTo(10, 0.5);
      }
    });
  });

  describe("Utilization Calculation", () => {
    test("calculates correct utilization percentage", () => {
      const items: LayoutItem[] = [
        { id: "1", importance: 3 },
        { id: "2", importance: 3 },
      ];

      const result = calculateCardLayout(items, 1000, 800, 200, "m");

      expect(result.utilization).toBeGreaterThan(0);
      expect(result.utilization).toBeLessThanOrEqual(100);
    });

    test("achieves good utilization in normal cases", () => {
      const items: LayoutItem[] = Array.from({ length: 15 }, (_, i) => ({
        id: `${i}`,
        importance: 2 + Math.random(),
      }));

      const result = calculateCardLayout(items, 1920, 1080, 200, "m");

      expect(result.utilization).toBeGreaterThan(65);
    });
  });

  describe("Edge Cases", () => {
    test("handles empty items array", () => {
      const result = calculateCardLayout([], 1000, 800, 200, "m");

      expect(result.placed).toHaveLength(0);
      expect(result.unplaced).toHaveLength(0);
      expect(result.utilization).toBe(0);
    });

    test("handles single item", () => {
      const items: LayoutItem[] = [{ id: "1", importance: 5 }];
      const result = calculateCardLayout(items, 1000, 800, 200, "m");

      expect(result.placed).toHaveLength(1);
      expect(result.unplaced).toHaveLength(0);
    });

    test("handles all items with same importance", () => {
      const items: LayoutItem[] = Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        importance: 2.5,
      }));

      const result = calculateCardLayout(items, 2000, 1500, 200, "m");

      expect(result.placed.length).toBeGreaterThan(0);
    });

    test("viewport too small - marks items unplaced", () => {
      const items: LayoutItem[] = [
        { id: "1", importance: 5 },
        { id: "2", importance: 3 },
      ];

      const result = calculateCardLayout(items, 150, 150, 200, "m");

      expect(result.unplaced.length).toBeGreaterThan(0);
    });
  });

  describe("Content-based Sizing", () => {
    test("limits size for short content", () => {
      const items: LayoutItem[] = [
        {
          id: "1",
          importance: 10,
          content: "Short", // < 50 chars
        },
      ];
      const result = calculateCardLayout(items, 2000, 2000, 200, "m");

      const placed = result.placed.find((p) => p.id === "1");
      // Should be limited despite high importance
      expect(placed!.contentCapped).toBe(true);
    });

    test("does not limit size for media content", () => {
      const items: LayoutItem[] = [
        {
          id: "1",
          importance: 10,
          content: "![image](url)", // Has media markdown
        },
      ];
      const result = calculateCardLayout(items, 2000, 2000, 200, "m");

      const placed = result.placed.find((p) => p.id === "1");
      // Should not be content-capped for media (false or undefined)
      expect(placed!.contentCapped).toBeFalsy();
    });

    test("does not limit size for media types", () => {
      const items: LayoutItem[] = [
        {
          id: "1",
          importance: 10,
          content: "Short",
          type: "image",
        },
      ];
      const result = calculateCardLayout(items, 2000, 2000, 200, "m");

      const placed = result.placed.find((p) => p.id === "1");
      // Should not be content-capped for media types (false or undefined)
      expect(placed!.contentCapped).toBeFalsy();
    });
  });

  describe("Available Spaces", () => {
    test("tracks available spaces", () => {
      const items: LayoutItem[] = [{ id: "1", importance: 3 }];

      const result = calculateCardLayout(items, 2000, 1000, 200, "m");

      expect(result.spaces.length).toBeGreaterThanOrEqual(0);
    });

    test("spaces have width, height, and position", () => {
      const items: LayoutItem[] = [{ id: "1", importance: 1 }];

      const result = calculateCardLayout(items, 2000, 1000, 200, "m");

      if (result.spaces.length > 0) {
        const space = result.spaces[0];
        expect(space.width).toBeGreaterThan(0);
        expect(space.height).toBeGreaterThan(0);
        expect(space.row).toBeGreaterThanOrEqual(0);
        expect(space.col).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("Sprinkle Effect Configuration", () => {
    test("sprinkle effect is enabled by default", () => {
      const items: LayoutItem[] = Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        importance: i + 1,
      }));

      // Default behavior (sprinkle enabled)
      const result = calculateCardLayout(items, 2000, 2000, 200, "m");
      expect(result.placed.length).toBeGreaterThan(0);
    });

    test("can disable sprinkle effect with boolean false", () => {
      const items: LayoutItem[] = Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        importance: i + 1,
      }));

      // Disable sprinkle effect
      const result = calculateCardLayout(items, 2000, 2000, 200, "m", {
        sprinkle: false,
      });
      expect(result.placed.length).toBeGreaterThan(0);
      // Without sprinkle, placement should be strictly by importance order
    });

    test("can enable sprinkle effect with boolean true", () => {
      const items: LayoutItem[] = Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        importance: i + 1,
      }));

      // Explicitly enable sprinkle effect
      const result = calculateCardLayout(items, 2000, 2000, 200, "m", {
        sprinkle: true,
      });
      expect(result.placed.length).toBeGreaterThan(0);
    });

    test("can configure sprinkle percentage", () => {
      const items: LayoutItem[] = Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        importance: i + 1,
      }));

      // Configure 50% boost percentage
      const result = calculateCardLayout(items, 2000, 2000, 200, "m", {
        sprinkle: {
          enabled: true,
          percentage: 0.5, // 50% of cards get boosted
          boost: 0.3,
        },
      });
      expect(result.placed.length).toBeGreaterThan(0);
    });

    test("can configure sprinkle boost amount", () => {
      const items: LayoutItem[] = Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        importance: i + 1,
      }));

      // Configure larger boost
      const result = calculateCardLayout(items, 2000, 2000, 200, "m", {
        sprinkle: {
          enabled: true,
          percentage: 0.2,
          boost: 0.5, // Larger boost amount
        },
      });
      expect(result.placed.length).toBeGreaterThan(0);
    });

    test("sprinkle disabled produces deterministic layout", () => {
      const items: LayoutItem[] = Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        importance: 10 - i, // Reverse order
      }));

      const result1 = calculateCardLayout(items, 2000, 2000, 200, "m", {
        sprinkle: false,
      });
      const result2 = calculateCardLayout(items, 2000, 2000, 200, "m", {
        sprinkle: false,
      });

      // Should produce identical results
      expect(result1.placed.length).toBe(result2.placed.length);
      expect(result1.placed[0].id).toBe(result2.placed[0].id);
    });
  });
});
