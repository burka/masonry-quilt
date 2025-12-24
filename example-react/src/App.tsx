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
        <h1>🧩 masonry-quilt</h1>
        <p className="subtitle">
          A pure TypeScript masonry layout calculator — items in, pixel positions out.
        </p>
      </header>

      {/* Info Panel */}
      <div className="settings-panel" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: '1 1 300px', minWidth: '280px' }}>
            <h3 style={{ marginBottom: '12px', color: '#333' }}>Quick Start</h3>
            <pre style={{
              background: '#1e1e1e',
              color: '#d4d4d4',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '13px',
              overflow: 'auto',
              margin: 0
            }}>{`npm install masonry-quilt

import { calculateLayout } from "masonry-quilt";

const result = calculateLayout(items, width, height);
// result.cards[].x, .y, .width, .height`}</pre>
          </div>
          <div style={{ flex: '0 0 auto' }}>
            <h3 style={{ marginBottom: '12px', color: '#333' }}>Links</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <a
                href="https://github.com/burka/masonry-quilt"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  background: '#24292e',
                  color: 'white',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontWeight: 500
                }}
              >
                <svg height="18" width="18" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
                </svg>
                GitHub Repo
              </a>
              <a
                href="https://www.npmjs.com/package/masonry-quilt"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  background: '#cb3837',
                  color: 'white',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontWeight: 500
                }}
              >
                <svg height="18" width="18" viewBox="0 0 256 256" fill="currentColor">
                  <path d="M0 256V0h256v256H0z" fill="#cb3837"/>
                  <path d="M48 48v160h80v-32h48V48H48zm64 128V80h32v96h-32z" fill="white"/>
                </svg>
                npm Package
              </a>
            </div>
          </div>
        </div>
        <p style={{ marginTop: '16px', color: '#666', fontSize: '14px' }}>
          Zero dependencies. Works anywhere JS runs. Resize this window to see the layout adapt!
        </p>
      </div>

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
        onLayoutChange={handleLayoutChange}
        className="masonry-container"
      >
        {(card) => <Card card={card} cellSize={cellSize} gap={gap} />}
      </MasonryGrid>

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
