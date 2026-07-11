interface PackingModeCardData {
  type: 'control-packing';
  id: string;
  label: string;
}

interface Props {
  card: PackingModeCardData;
  value: 'grid' | 'exact';
  onChange: (mode: 'grid' | 'exact') => void;
}

const OPTIONS: { key: 'grid' | 'exact'; icon: string; title: string; hint: string }[] = [
  { key: 'grid', icon: '▦', title: 'Grid', hint: 'CSS-grid spans' },
  { key: 'exact', icon: '⬚', title: 'Exact', hint: 'Pixel-exact skyline' },
];

export function PackingModeCard({ card, value, onChange }: Props) {
  return (
    <div className="card packing-mode-card" style={{
      background: 'var(--bg-card)',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: '12px'
    }}>
      <label style={{
        color: 'var(--text-primary)',
        fontWeight: 600,
        fontSize: '14px'
      }}>
        {card.label}
      </label>
      <div style={{ display: 'flex', gap: '8px' }} role="tablist" aria-label={card.label}>
        {OPTIONS.map((option) => {
          const selected = value === option.key;
          return (
            <button
              key={option.key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(option.key)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                padding: '10px 8px',
                borderRadius: '10px',
                border: '2px solid',
                borderColor: selected ? 'var(--accent-2)' : 'var(--bg-secondary)',
                background: selected ? 'var(--accent-2)' : 'transparent',
                color: selected ? 'white' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              <span style={{ fontSize: '18px' }}>{option.icon}</span>
              {option.title}
            </button>
          );
        })}
      </div>
      <span style={{
        color: 'var(--text-secondary)',
        fontSize: '11px',
        textAlign: 'center'
      }}>
        {OPTIONS.find((o) => o.key === value)?.hint}
      </span>
    </div>
  );
}
