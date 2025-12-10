import { useState, useEffect, useRef } from "react";
import { calculateLayout, createResizeObserver } from "masonry-quilt";
import type { LayoutItem, PlacedCard } from "masonry-quilt";
import { motion, LayoutGroup, AnimatePresence } from "framer-motion";
import "./App.css";

// Custom interface extending LayoutItem
interface CardItem extends LayoutItem {
  id: string;
  emoji: string;
  color: string;
}

// Sample data - items are now placed in INPUT ORDER
const sampleItems: CardItem[] = [
  { id: "1", emoji: "🎯", color: "#FF6B6B" },
  { id: "2", emoji: "🔥", color: "#4ECDC4" },
  { id: "3", emoji: "⭐", color: "#45B7D1" },
  { id: "4", emoji: "📸", color: "#FFA07A", format: { ratio: "landscape" } },
  { id: "5", emoji: "🎬", color: "#98D8C8", format: { ratio: "16:9" } },
  { id: "6", emoji: "💡", color: "#F7DC6F" },
  { id: "7", emoji: "📝", color: "#BB8FCE" },
  { id: "8", emoji: "✅", color: "#85C1E2" },
  { id: "9", emoji: "📋", color: "#F8B195" },
  { id: "10", emoji: "🗒️", color: "#C06C84" },
  { id: "11", emoji: "🎨", color: "#E74C3C", format: { ratio: "banner" } },
  { id: "12", emoji: "📱", color: "#3498DB", format: { ratio: "portrait" } },
  { id: "13", emoji: "🌟", color: "#2ECC71" },
  { id: "14", emoji: "🎵", color: "#9B59B6" },
  { id: "15", emoji: "📄", color: "#1ABC9C" },
  { id: "16", emoji: "🚀", color: "#E67E22" },
  { id: "17", emoji: "📊", color: "#34495E", format: { ratio: "landscape", loose: true } },
  { id: "18", emoji: "🎮", color: "#16A085" },
  { id: "19", emoji: "💬", color: "#D35400" },
  { id: "20", emoji: "🏷️", color: "#8E44AD" },
];

// Card component with big fonts and Framer Motion animations
function Card({ card }: { card: PlacedCard<CardItem> }) {
  const colSpan = card.grid!.colSpan;
  const rowSpan = card.grid!.rowSpan;

  // Calculate responsive font size based on card size
  const area = colSpan * rowSpan;
  let fontSize = 16;
  if (area >= 16) fontSize = 48;
  else if (area >= 9) fontSize = 36;
  else if (area >= 4) fontSize = 28;
  else if (area >= 2) fontSize = 20;

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
  const [cellSize] = useState(200);

  useEffect(() => {
    if (!containerRef.current) return;

    const performLayout = (width: number, height: number) => {
      const result = calculateLayout(sampleItems, width, height, {
        baseSize: cellSize,
        gap: 16,
        includeGrid: true,
      });

      setLayout(result.cards);

      // Calculate grid dimensions from pixel dimensions
      const cols = Math.round(result.width / cellSize);
      const rows = Math.round(result.height / cellSize);
      setGridDimensions({ cols, rows });

      setUtilization(result.utilization);
      setOrderFidelity(result.orderFidelity);
    };

    // Initial calculation
    const rect = containerRef.current.getBoundingClientRect();
    performLayout(rect.width, rect.height);

    // Setup resize observer with throttling (150ms debounce)
    const cleanup = createResizeObserver(containerRef.current, performLayout, 150);

    return cleanup;
  }, [cellSize]);

  return (
    <div className="app">
      <header className="header">
        <h1>🧩 masonry-quilt React Example</h1>
        <p className="subtitle">Resize the window to see smooth Framer Motion animations!</p>
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
        </div>
      </header>

      <div ref={containerRef} className="masonry-container">
        <div
          className="masonry-grid"
          style={{
            gridTemplateColumns: `repeat(${gridDimensions.cols}, 1fr)`,
            gridAutoRows: `${cellSize}px`,
          }}
        >
          <LayoutGroup>
            <AnimatePresence mode="popLayout">
              {layout.map((card) => (
                <Card key={card.item.id} card={card} />
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
