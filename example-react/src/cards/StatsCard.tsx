import type { LayoutMetrics } from './types';

interface Props {
  metrics: LayoutMetrics;
}

export function StatsCard({ metrics }: Props) {
  const statItems = [
    { label: 'Grid', value: `${metrics.cols}×${metrics.rows}`, color: 'var(--accent-2)' },
    { label: 'Cards', value: metrics.cardCount.toString(), color: 'var(--accent-4)' },
    { label: 'Util', value: `${(metrics.utilization * 100).toFixed(0)}%`, color: 'var(--accent-3)' },
    { label: 'Fidelity', value: `${(metrics.orderFidelity * 100).toFixed(0)}%`, color: 'var(--accent-5)' },
  ];

  return (
    <div className="card stats-card" style={{
      background: 'var(--bg-card)',
      padding: '16px',
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '12px'
    }}>
      {statItems.map(item => (
        <div key={item.label} style={{
          background: 'var(--bg-secondary)',
          padding: '12px',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{
            color: item.color,
            fontSize: 'clamp(18px, 4vw, 28px)',
            fontWeight: 700
          }}>
            {item.value}
          </div>
          <div style={{
            color: 'var(--text-secondary)',
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}
