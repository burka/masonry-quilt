import { useState, useEffect, useRef } from "react";
import { calculateLayout, createResizeObserver } from "masonry-quilt";
import type { LayoutItem, PlacedCard, LayoutResult } from "masonry-quilt";
import { motion, LayoutGroup, AnimatePresence } from "framer-motion";
import "./App.css";

// Custom interface extending LayoutItem
interface CardItem extends LayoutItem {
  id: string;
  emoji: string;
  color: string;
}

// Generate sample data with variety of formats
const generateSampleItems = (count: number): CardItem[] => {
  const emojis = ["🎯", "🔥", "⭐", "📸", "🎬", "💡", "📝", "✅", "📋", "🗒️", "🎨", "📱", "🌟", "🎵", "📄", "🚀", "📊", "🎮", "💬", "🏷️", "🎪", "🎭", "🎪", "🎯", "🔧", "🔨", "🔩", "🔗", "🔓", "🔒", "🔑", "🔐", "🔍", "🔎", "🔬", "🔭", "📡", "📡", "📡", "📡"];
  const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E2", "#F8B195", "#C06C84", "#E74C3C", "#3498DB", "#2ECC71", "#9B59B6", "#1ABC9C", "#E67E22", "#34495E", "#16A085", "#D35400", "#8E44AD"];
  const ratios = [
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

  const items: CardItem[] = [];
  for (let i = 0; i < count; i++) {
    items.push({
      id: String(i + 1),
      emoji: emojis[i % emojis.length],
      color: colors[i % colors.length],
      format: ratios[i % ratios.length],
    });
  }
  return items;
};

const sampleItems = generateSampleItems(1000);

// Card component with big fonts and Framer Motion animations
function Card({ card, cellSize, gap }: { card: PlacedCard<CardItem>; cellSize: number; gap: number }) {
  const colSpan = card.grid!.colSpan;
  const rowSpan = card.grid!.rowSpan;

  // Calculate responsive font size based on card size and cell size
  const area = colSpan * rowSpan;
  let fontSize = Math.max(8, Math.min(48, cellSize / 8));
  
  if (area >= 16) fontSize = Math.max(12, Math.min(48, cellSize / 4));
  else if (area >= 9) fontSize = Math.max(10, Math.min(36, cellSize / 5));
  else if (area >= 4) fontSize = Math.max(8, Math.min(28, cellSize / 6));
  else if (area >= 2) fontSize = Math.max(6, Math.min(20, cellSize / 8));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{
        layout: {
          type: "spring",
          stiffness: 250,
          damping: 20,
        },
        opacity: { duration: 0.3 },
        scale: { duration: 0.3 },
      }}
      className="card"
      style={{
        gridRow: `span ${rowSpan}`,
        gridColumn: `span ${colSpan}`,
        backgroundColor: card.item.color,
        fontSize: `${fontSize}px`,
        fontWeight: "bold",
        borderRadius: `${Math.max(0, gap / 2)}px`,
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
    </motion.div>
  );
}

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<PlacedCard<CardItem>[]>([]);
  const [gridDimensions, setGridDimensions] = useState({ cols: 0, rows: 0 });
  const [utilization, setUtilization] = useState(0);
  const [orderFidelity, setOrderFidelity] = useState(0);
  const [calculationTime, setCalculationTime] = useState(0);
  
  // Interactive settings
  const [cellSize, setCellSize] = useState(200);
  const [gap, setGap] = useState(16);
  const [looseness, setLooseness] = useState(0.2);
  const [cardCount, setCardCount] = useState(20);
  const [selectedRatios, setSelectedRatios] = useState<string[]>([]);
  
  // Get available ratio options from sample data
  const availableRatios = Array.from(new Set(
    sampleItems
      .filter(item => item.format?.ratio)
      .map(item => item.format!.ratio!)
  ));

  // Filter items based on selected ratios and card count
  const getFilteredItems = () => {
    let items = sampleItems.slice(0, cardCount);
    
    if (selectedRatios.length > 0) {
      items = items.filter(item => 
        !item.format?.ratio || selectedRatios.includes(item.format.ratio)
      );
    }
    
    return items;
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const performLayout = (width: number, height: number) => {
      const filteredItems = getFilteredItems();
      
// Measure calculation time with multiple iterations for accuracy
      const iterations = 10;
      const startTime = performance.now();
      
      let result: LayoutResult<CardItem> | undefined;
      for (let i = 0; i < iterations; i++) {
        result = calculateLayout(filteredItems, width, height, {
          baseSize: cellSize,
          gap: gap,
          looseness: looseness,
          includeGrid: true,
        });
      }
      
      const endTime = performance.now();
      const avgTime = (endTime - startTime) / iterations;
      
      setCalculationTime(avgTime);
      setLayout(result!.cards);

      // Calculate grid dimensions from pixel dimensions
      const cols = Math.round(result!.width / cellSize);
      const rows = Math.round(result!.height / cellSize);
      setGridDimensions({ cols, rows });

      setUtilization(result!.utilization);
      setOrderFidelity(result!.orderFidelity);
    };

    // Initial calculation
    const rect = containerRef.current.getBoundingClientRect();
    performLayout(rect.width, rect.height);

    // Setup resize observer with throttling (150ms debounce)
    const cleanup = createResizeObserver(containerRef.current, performLayout, 150);

    return cleanup;
  }, [cellSize, gap, looseness, cardCount, selectedRatios]);

  return (
    <div className="app">
      <header className="header">
        <h1>🧩 masonry-quilt React Example</h1>
        <p className="subtitle">Resize the window to see smooth Framer Motion animations!</p>
      </header>

      {/* Interactive Settings Panel */}
      <div className="settings-panel">
        <h3>⚙️ Layout Settings</h3>
        <div className="settings-grid">
          {/* Cell Size */}
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

          {/* Gap Size */}
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

          {/* Density vs Order */}
          <div className="setting">
            <label>
              {looseness < 0.3 ? "📋 Order Priority" : looseness > 0.7 ? "📦 Density Priority" : "⚖️ Balanced"}
              : {Math.round(looseness * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={looseness}
              onChange={(e) => setLooseness(Number(e.target.value))}
            />
          </div>

          {/* Card Count */}
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

        {/* Aspect Ratio Filter */}
        <div className="setting">
          <label>Aspect Ratios:</label>
          <div className="ratio-filters">
            <button
              className={`ratio-filter ${selectedRatios.length === 0 ? 'active' : ''}`}
              onClick={() => setSelectedRatios([])}
            >
              All
            </button>
            {availableRatios.map(ratio => (
              <button
                key={ratio}
                className={`ratio-filter ${selectedRatios.includes(ratio) ? 'active' : ''}`}
                onClick={() => {
                  if (selectedRatios.includes(ratio)) {
                    setSelectedRatios(selectedRatios.filter(r => r !== ratio));
                  } else {
                    setSelectedRatios([...selectedRatios, ratio]);
                  }
                }}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Block */}
      <header className="header stats-header">
        <div className="stats">
          <div className="stat">
            <span className="stat-label">Grid:</span>
            <span className="stat-value">
              {gridDimensions.cols}x{gridDimensions.rows}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Cards:</span>
            <span className="stat-value">{layout.length}</span>
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
            <span className="stat-label">Calculation Time:</span>
            <span className="stat-value">
              {calculationTime.toFixed(2)}ms
              {calculationTime < 1 && layout.length > 500 && " ⚡"}
            </span>
          </div>
        </div>
      </header>

      <div ref={containerRef} className="masonry-container">
        <div
          className="masonry-grid"
          style={{
            gridTemplateColumns: `repeat(${gridDimensions.cols}, 1fr)`,
            gridAutoRows: `${cellSize}px`,
            gap: `${gap}px`,
          }}
        >
          <LayoutGroup>
            <AnimatePresence mode="popLayout">
              {layout.map((card) => (
                <Card key={card.item.id} card={card} cellSize={cellSize} gap={gap} />
              ))}
            </AnimatePresence>
          </LayoutGroup>
        </div>
      </div>

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
