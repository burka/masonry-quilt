import { useState, useCallback } from "react";
import type { LayoutItem, PlacedCard, LayoutResult } from "masonry-quilt";
import { MasonryGrid } from "./MasonryGrid";
import "./App.css";

// Custom interface extending LayoutItem
interface CardItem extends LayoutItem {
  id: string;
  emoji: string;
  color: string;
}

// Generate sample data with variety of formats
const generateSampleItems = (count: number): CardItem[] => {
  const emojis = [
    "🎯", "🔥", "⭐", "📸", "🎬", "💡", "📝", "✅", "📋", "🗒️",
    "🎨", "📱", "🌟", "🎵", "📄", "🚀", "📊", "🎮", "💬", "🏷️",
  ];
  const colors = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8",
    "#F7DC6F", "#BB8FCE", "#85C1E2", "#F8B195", "#C06C84",
    "#E74C3C", "#3498DB", "#2ECC71", "#9B59B6", "#1ABC9C",
    "#E67E22", "#34495E", "#16A085", "#D35400", "#8E44AD",
  ];
  const ratios: (LayoutItem["format"] | undefined)[] = [
    undefined,
    { ratio: "landscape" },
    { ratio: "16:9" },
    { ratio: "4:3" },
    { ratio: "1:1" },
    { ratio: "3:2" },
    { ratio: "portrait" },
    { ratio: "banner" },
    { ratio: "tower" },
    { ratio: "landscape", loose: true },
    { ratio: "portrait", loose: true },
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: String(i + 1),
    emoji: emojis[i % emojis.length],
    color: colors[i % colors.length],
    format: ratios[i % ratios.length],
  }));
};

const allItems = generateSampleItems(1000);

// Available ratio options
const availableRatios = ["landscape", "16:9", "4:3", "1:1", "3:2", "portrait", "banner", "tower"];

// Card component
function Card({ card, cellSize, gap }: { card: PlacedCard<CardItem>; cellSize: number; gap: number }) {
  const { colSpan, rowSpan } = card.grid!;
  const area = colSpan * rowSpan;

  // Calculate responsive font size based on card area
  let fontSize = Math.max(8, Math.min(48, cellSize / 8));
  if (area >= 16) fontSize = Math.max(12, Math.min(48, cellSize / 4));
  else if (area >= 9) fontSize = Math.max(10, Math.min(36, cellSize / 5));
  else if (area >= 4) fontSize = Math.max(8, Math.min(28, cellSize / 6));
  else if (area >= 2) fontSize = Math.max(6, Math.min(20, cellSize / 8));

  return (
    <div
      className="card"
      style={{
        backgroundColor: card.item.color,
        fontSize: `${fontSize}px`,
        fontWeight: "bold",
        borderRadius: `${Math.max(0, gap / 2)}px`,
        height: "100%",
      }}
    >
      <div className="card-content">
        <div className="card-emoji">{card.item.emoji}</div>
        <div className="card-meta">
          <div className="card-size">
            {colSpan}x{rowSpan}
          </div>
        </div>
      </div>
    </div>
  );
}

// Stats display component
function Stats({
  cols,
  rows,
  cardCount,
  utilization,
  orderFidelity,
  calculationTime,
}: {
  cols: number;
  rows: number;
  cardCount: number;
  utilization: number;
  orderFidelity: number;
  calculationTime: number;
}) {
  return (
    <div className="stats">
      <div className="stat">
        <span className="stat-label">Grid:</span>
        <span className="stat-value">{cols}x{rows}</span>
      </div>
      <div className="stat">
        <span className="stat-label">Cards:</span>
        <span className="stat-value">{cardCount}</span>
      </div>
      <div className="stat">
        <span className="stat-label">Utilization:</span>
        <span className="stat-value">{(utilization * 100).toFixed(0)}%</span>
      </div>
      <div className="stat">
        <span className="stat-label">Order Fidelity:</span>
        <span className="stat-value">{(orderFidelity * 100).toFixed(0)}%</span>
      </div>
      <div className="stat">
        <span className="stat-label">Calc Time:</span>
        <span className="stat-value">
          {calculationTime.toFixed(2)}ms
          {calculationTime < 1 && cardCount > 500 && " ⚡"}
        </span>
      </div>
    </div>
  );
}

export default function App() {
  // Layout settings
  const [cellSize, setCellSize] = useState(200);
  const [gap, setGap] = useState(16);
  const [cardCount, setCardCount] = useState(20);
  const [selectedRatios, setSelectedRatios] = useState<string[]>([]);

  // Layout stats
  const [stats, setStats] = useState({
    cols: 0,
    rows: 0,
    utilization: 0,
    orderFidelity: 0,
    calculationTime: 0,
  });

  // Filter items based on settings
  const items = allItems
    .slice(0, cardCount)
    .filter(
      (item) =>
        selectedRatios.length === 0 ||
        !item.format?.ratio ||
        selectedRatios.includes(item.format.ratio)
    );

  // Handle layout changes
  const handleLayoutChange = useCallback((result: LayoutResult<CardItem>) => {
    setStats({
      cols: Math.round(result.width / cellSize),
      rows: Math.round(result.height / cellSize),
      utilization: result.utilization,
      orderFidelity: result.orderFidelity,
      calculationTime: 0, // Would need to measure separately
    });
  }, [cellSize]);

  const toggleRatio = (ratio: string) => {
    setSelectedRatios((prev) =>
      prev.includes(ratio) ? prev.filter((r) => r !== ratio) : [...prev, ratio]
    );
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🧩 masonry-quilt React Example</h1>
        <p className="subtitle">Resize the window to see smooth Framer Motion animations!</p>
      </header>

      {/* Settings Panel */}
      <div className="settings-panel">
        <h3>⚙️ Layout Settings</h3>
        <div className="settings-grid">
          <div className="setting">
            <label>Cell Size: {cellSize}px</label>
            <input
              type="range"
              min="25"
              max="400"
              step="25"
              value={cellSize}
              onChange={(e) => setCellSize(Number(e.target.value))}
            />
          </div>

          <div className="setting">
            <label>Gap: {gap}px</label>
            <input
              type="range"
              min="0"
              max="32"
              step="4"
              value={gap}
              onChange={(e) => setGap(Number(e.target.value))}
            />
          </div>

          <div className="setting">
            <label>Cards: {cardCount}</label>
            <input
              type="range"
              min="5"
              max="1000"
              step="5"
              value={cardCount}
              onChange={(e) => setCardCount(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="setting">
          <label>Aspect Ratios:</label>
          <div className="ratio-filters">
            <button
              className={`ratio-filter ${selectedRatios.length === 0 ? "active" : ""}`}
              onClick={() => setSelectedRatios([])}
            >
              All
            </button>
            {availableRatios.map((ratio) => (
              <button
                key={ratio}
                className={`ratio-filter ${selectedRatios.includes(ratio) ? "active" : ""}`}
                onClick={() => toggleRatio(ratio)}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <header className="header stats-header">
        <Stats
          cols={stats.cols}
          rows={stats.rows}
          cardCount={items.length}
          utilization={stats.utilization}
          orderFidelity={stats.orderFidelity}
          calculationTime={stats.calculationTime}
        />
      </header>

      {/* Masonry Grid */}
      <MasonryGrid
        items={items}
        cellSize={cellSize}
        gap={gap}
        getItemKey={(item) => item.id}
        renderCard={(card) => <Card card={card} cellSize={cellSize} gap={gap} />}
        onLayoutChange={handleLayoutChange}
        className="masonry-container"
      />

      <footer className="footer">
        <p>
          <strong>Try resizing your window!</strong> 🎨
          <br />
          Cards smoothly animate to their new positions with Framer Motion
          <br />
          <small>
            Powered by <strong>masonry-quilt</strong> - Pure TypeScript layout calculator
          </small>
        </p>
      </footer>
    </div>
  );
}
