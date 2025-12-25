import type { LayoutItem } from "masonry-quilt";

// Base card interface that extends LayoutItem
export interface BaseCard extends LayoutItem {
  id: string;
  type: CardType;
}

// All possible card types
export type CardType =
  | "hero"
  | "quickstart"
  | "stats"
  | "feature"
  | "control-slider"
  | "control-toggle"
  | "control-ratio-filter"
  | "metric"
  | "code"
  | "link"
  | "theme-toggle"
  | "demo-item"; // For the actual emoji demo cards

// Hero card - large title card
export interface HeroCard extends BaseCard {
  type: "hero";
  title: string;
  subtitle: string;
  version?: string;
}

// Quick start card - code snippet
export interface QuickStartCard extends BaseCard {
  type: "quickstart";
  code: string;
}

// Stats card - shows live metrics
export interface StatsCard extends BaseCard {
  type: "stats";
  // Stats will be injected at render time
}

// Feature card - highlights a feature
export interface FeatureCard extends BaseCard {
  type: "feature";
  icon: string; // emoji
  title: string;
  description: string;
  color: string; // accent color
}

// Slider control card
export interface SliderControlCard extends BaseCard {
  type: "control-slider";
  label: string;
  settingKey: "cellSize" | "gap" | "cardCount" | "borderRadius";
  min: number;
  max: number;
  step: number;
}

// Toggle control card
export interface ToggleControlCard extends BaseCard {
  type: "control-toggle";
  label: string;
  settingKey: string;
}

// Ratio filter card
export interface RatioFilterCard extends BaseCard {
  type: "control-ratio-filter";
  ratios: string[];
}

// Metric card - single metric display
export interface MetricCard extends BaseCard {
  type: "metric";
  metricKey:
    | "utilization"
    | "orderFidelity"
    | "calcTime"
    | "gridDimensions"
    | "cardCount";
  label: string;
  icon: string;
  color: string;
}

// Code example card
export interface CodeCard extends BaseCard {
  type: "code";
  title: string;
  language: string;
  code: string;
}

// Link card - external links
export interface LinkCard extends BaseCard {
  type: "link";
  icon: string; // emoji or 'github' | 'npm'
  label: string;
  url: string;
  color: string;
}

// Theme toggle card
export interface ThemeToggleCard extends BaseCard {
  type: "theme-toggle";
}

// Demo item card (the emoji cards)
export interface DemoItemCard extends BaseCard {
  type: "demo-item";
  emoji: string;
  color: string;
}

// Union type of all cards
export type ShowcaseCard =
  | HeroCard
  | QuickStartCard
  | StatsCard
  | FeatureCard
  | SliderControlCard
  | ToggleControlCard
  | RatioFilterCard
  | MetricCard
  | CodeCard
  | LinkCard
  | ThemeToggleCard
  | DemoItemCard;

// Settings type for the app state
export interface LayoutSettings {
  cellSize: number;
  gap: number;
  cardCount: number;
  selectedRatios: string[];
  theme: "light" | "dark";
}

// Layout metrics from calculation
export interface LayoutMetrics {
  cols: number;
  rows: number;
  utilization: number;
  orderFidelity: number;
  calculationTime: number;
  cardCount: number;
}
