import { useState, useEffect, useRef } from "react";
import { calculateCardLayout, createResizeObserver } from "masonry-quilt";
import type { LayoutItem, PlacedCard } from "masonry-quilt";
import { motion, LayoutGroup, AnimatePresence } from "framer-motion";
import "./App.css";

// Sample data with various importance levels and content
const sampleItems: LayoutItem[] = [
  { id: "1", importance: 10, content: "🎯 Most Important", type: "text" },
  { id: "2", importance: 9, content: "🔥 Very High Priority", type: "text" },
  { id: "3", importance: 8, content: "⭐ High Priority", type: "text" },
  {
    id: "4",
    importance: 7,
    content: "📸 Image Card",
    type: "image",
  },
  { id: "5", importance: 6, content: "🎬 Video Card", type: "video" },
  { id: "6", importance: 5, content: "💡 Medium", type: "text" },
  { id: "7", importance: 4, content: "📝 Note", type: "text" },
  { id: "8", importance: 3, content: "✅ Task", type: "text" },
  { id: "9", importance: 2, content: "📋 List", type: "text" },
  { id: "10", importance: 1, content: "🗒️ Small", type: "text" },
  {
    id: "11",
    importance: 8,
    content: "🎨 Wide Banner",
    format: { ratio: "banner", strict: true },
  },
  {
    id: "12",
    importance: 7,
    content: "📱 Portrait",
    format: { ratio: "portrait", strict: true },
  },
  { id: "13", importance: 6, content: "🌟 Regular Card", type: "text" },
  { id: "14", importance: 5, content: "🎵 Audio", type: "audio" },
  { id: "15", importance: 4, content: "📄 Document", type: "document" },
  { id: "16", importance: 9, content: "🚀 Launch Ready", type: "text" },
  {
    id: "17",
    importance: 8,
    content: "📊 Dashboard",
    format: { ratio: "landscape", strict: false },
  },
  { id: "18", importance: 7, content: "🎮 Game", type: "text" },
  { id: "19", importance: 3, content: "💬 Comment", type: "text" },
  { id: "20", importance: 2, content: "🏷️ Tag", type: "text" },
];

// Card component with big fonts and Framer Motion animations
function Card({ card, item }: { card: PlacedCard; item: LayoutItem }) {
  const cellWidth = card.width / 4;
  const cellHeight = card.height / 4;

  // Calculate responsive font size based on card size
  const area = cellWidth * cellHeight;
  let fontSize = 16;
  if (area >= 16) fontSize = 48;
  else if (area >= 9) fontSize = 36;
  else if (area >= 4) fontSize = 28;
  else if (area >= 2) fontSize = 20;

  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#FFA07A",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E2",
    "#F8B195",
    "#C06C84",
  ];
  const colorIndex = parseInt(card.id, 10) % colors.length;
  const bgColor = colors[colorIndex];

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
        gridRow: `span ${cellHeight}`,
        gridColumn: `span ${cellWidth}`,
        backgroundColor: bgColor,
        fontSize: `${fontSize}px`,
        fontWeight: "bold",
      }}
    >
      <div className="card-content">
        <div className="card-emoji">{item.content}</div>
        <div className="card-meta">
          <div className="card-size">
            {cellWidth}x{cellHeight}
          </div>
          <div className="card-importance">★ {item.importance}</div>
          {card.contentCapped && <div className="card-capped">📏 Capped</div>}
        </div>
      </div>
    </motion.div>
  );
}

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<PlacedCard[]>([]);
  const [gridDimensions, setGridDimensions] = useState({ cols: 0, rows: 0 });
  const [utilization, setUtilization] = useState(0);
  const [cellSize] = useState(200);

  useEffect(() => {
    if (!containerRef.current) return;

    const calculateLayout = (width: number, height: number) => {
      const result = calculateCardLayout(sampleItems, width, height, cellSize, "m");
      setLayout(result.placed);
      setGridDimensions(result.grid);
      setUtilization(result.utilization);
    };

    // Initial calculation
    const rect = containerRef.current.getBoundingClientRect();
    calculateLayout(rect.width, rect.height);

    // Setup resize observer with throttling (150ms debounce)
    const cleanup = createResizeObserver(containerRef.current, calculateLayout, 150);

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
            <span className="stat-value">{utilization}%</span>
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
              {layout.map((card) => {
                const item = sampleItems.find((i) => i.id === card.id);
                return item ? <Card key={card.id} card={card} item={item} /> : null;
              })}
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
