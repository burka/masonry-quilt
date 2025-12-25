interface MetricCard {
  type: 'metric';
  id: string;
  metricKey: 'utilization' | 'orderFidelity' | 'calcTime' | 'gridDimensions' | 'cardCount';
  label: string;
  icon: string;
  color: string;
}

interface LayoutMetrics {
  cols: number;
  rows: number;
  utilization: number;
  orderFidelity: number;
  calculationTime: number;
  cardCount: number;
}

interface Props {
  card: MetricCard;
  metrics: LayoutMetrics;
}

export function MetricCard({ card, metrics }: Props) {
  const getValue = () => {
    switch (card.metricKey) {
      case 'utilization': return `${(metrics.utilization * 100).toFixed(0)}%`;
      case 'orderFidelity': return `${(metrics.orderFidelity * 100).toFixed(0)}%`;
      case 'calcTime': return `${metrics.calculationTime.toFixed(1)}ms`;
      case 'gridDimensions': return `${metrics.cols}×${metrics.rows}`;
      case 'cardCount': return metrics.cardCount.toString();
      default: return '—';
    }
  };

  return (
    <div className="card metric-card" style={{
      background: 'var(--bg-card)',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      textAlign: 'center'
    }}>
      <span style={{ fontSize: '24px' }}>{card.icon}</span>
      <div style={{
        color: card.color,
        fontSize: 'clamp(20px, 4vw, 32px)',
        fontWeight: 700,
        fontFamily: "'JetBrains Mono', monospace"
      }}>
        {getValue()}
      </div>
      <div style={{
        color: 'var(--text-secondary)',
        fontSize: '11px',
        textTransform: 'uppercase',
        letterSpacing: '1px'
      }}>
        {card.label}
      </div>
    </div>
  );
}
