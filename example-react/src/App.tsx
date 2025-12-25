import { useState, useCallback, useMemo } from "react";
import type { PlacedCard } from "masonry-quilt";
import { MasonryGrid, type LayoutResultWithTiming } from "./MasonryGrid";
import { ThemeProvider, useTheme } from "./theme";
import {
  type ShowcaseCard,
  type LayoutMetrics,
  HeroCard,
  QuickStartCard,
  StatsCard,
  SliderCard,
  RatioFilterCard,
  ThemeToggleCard,
  FeatureCard,
  MetricCard,
  CodeCard,
  LinkCard,
  DemoItemCard,
} from "./cards";
import { showcaseCards, generateDemoItems } from "./showcaseData";
import "./App.css";
import "./theme.css";

// Render the appropriate card based on type
function CardRenderer({
  card,
  metrics,
  settings,
  onSettingChange,
  gap,
  borderRadius,
}: {
  card: PlacedCard<ShowcaseCard>;
  metrics: LayoutMetrics;
  settings: { cellSize: number; gap: number; cardCount: number; borderRadius: number; selectedRatios: string[] };
  onSettingChange: (key: string, value: number | string[]) => void;
  gap: number;
  borderRadius: number;
}) {
  const { theme, toggleTheme } = useTheme();
  const { colSpan = 1, rowSpan = 1 } = card.grid || {};

  switch (card.item.type) {
    case "hero":
      return <HeroCard card={card.item} />;

    case "quickstart":
      return <QuickStartCard card={card.item} />;

    case "stats":
      return <StatsCard metrics={metrics} />;

    case "control-slider": {
      const sliderCard = card.item;
      return (
        <SliderCard
          card={sliderCard}
          value={settings[sliderCard.settingKey]}
          onChange={(val) => onSettingChange(sliderCard.settingKey, val)}
        />
      );
    }

    case "control-ratio-filter":
      return (
        <RatioFilterCard
          card={card.item}
          selectedRatios={settings.selectedRatios}
          onToggle={(ratio) => {
            const current = settings.selectedRatios;
            const updated = current.includes(ratio)
              ? current.filter((r) => r !== ratio)
              : [...current, ratio];
            onSettingChange("selectedRatios", updated);
          }}
          onClear={() => onSettingChange("selectedRatios", [])}
        />
      );

    case "theme-toggle":
      return <ThemeToggleCard card={card.item} theme={theme} onToggle={toggleTheme} />;

    case "feature":
      return <FeatureCard card={card.item} />;

    case "metric":
      return <MetricCard card={card.item} metrics={metrics} />;

    case "code":
      return <CodeCard card={card.item} />;

    case "link":
      return <LinkCard card={card.item} />;

    case "demo-item":
      return <DemoItemCard card={card.item} colSpan={colSpan} rowSpan={rowSpan} gap={gap} borderRadius={borderRadius} />;

    default:
      return null;
  }
}

function AppContent() {
  // Layout settings
  const [cellSize, setCellSize] = useState(150);
  const [gap, setGap] = useState(12);
  const [cardCount, setCardCount] = useState(30);
  const [borderRadius, setBorderRadius] = useState(16);
  const [selectedRatios, setSelectedRatios] = useState<string[]>([]);

  // Layout metrics
  const [metrics, setMetrics] = useState<LayoutMetrics>({
    cols: 0,
    rows: 0,
    utilization: 0,
    orderFidelity: 0,
    calculationTime: 0,
    cardCount: 0,
  });

  const settings = { cellSize, gap, cardCount, borderRadius, selectedRatios };

  const handleSettingChange = useCallback((key: string, value: number | string[]) => {
    switch (key) {
      case "cellSize":
        setCellSize(value as number);
        break;
      case "gap":
        setGap(value as number);
        break;
      case "cardCount":
        setCardCount(value as number);
        break;
      case "borderRadius":
        setBorderRadius(value as number);
        break;
      case "selectedRatios":
        setSelectedRatios(value as string[]);
        break;
    }
  }, []);

  // Combine showcase cards with demo items
  const allItems = useMemo(() => {
    // Generate demo items
    const demoItems = generateDemoItems(cardCount);

    // Filter demo items by selected ratios
    const filteredDemoItems = demoItems.filter(
      (item) =>
        selectedRatios.length === 0 ||
        !item.format?.ratio ||
        selectedRatios.includes(item.format.ratio as string)
    );

    // Combine: showcase cards first, then demo items
    return [...showcaseCards, ...filteredDemoItems];
  }, [cardCount, selectedRatios]);

  // Handle layout changes
  const handleLayoutChange = useCallback(
    (result: LayoutResultWithTiming<ShowcaseCard>) => {
      setMetrics({
        cols: Math.round(result.width / cellSize),
        rows: Math.round(result.height / cellSize),
        utilization: result.utilization,
        orderFidelity: result.orderFidelity,
        calculationTime: result.calculationTime,
        cardCount: result.cards.length,
      });
    },
    [cellSize]
  );

  return (
    <div className="app pure-masonry">
      <MasonryGrid
        items={allItems}
        cellSize={cellSize}
        gap={gap}
        getItemKey={(item) => item.id}
        onLayoutChange={handleLayoutChange}
        className="masonry-container"
      >
        {(card) => (
          <CardRenderer
            card={card}
            metrics={metrics}
            settings={settings}
            onSettingChange={handleSettingChange}
            gap={gap}
            borderRadius={borderRadius}
          />
        )}
      </MasonryGrid>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
