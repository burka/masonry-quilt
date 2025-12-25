interface RatioFilterCard {
  type: 'control-ratio-filter';
  id: string;
  ratios: string[];
}

interface Props {
  card: RatioFilterCard;
  selectedRatios: string[];
  onToggle: (ratio: string) => void;
  onClear: () => void;
}

export function RatioFilterCard({ card, selectedRatios, onToggle, onClear }: Props) {
  return (
    <div className="card ratio-filter-card" style={{
      background: 'var(--bg-card)',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <div style={{
        color: 'var(--text-primary)',
        fontWeight: 600,
        fontSize: '14px'
      }}>
        🎯 Aspect Ratios
      </div>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <button
          onClick={onClear}
          style={{
            padding: '6px 12px',
            borderRadius: '8px',
            border: '2px solid',
            borderColor: selectedRatios.length === 0 ? 'var(--accent-5)' : 'var(--bg-secondary)',
            background: selectedRatios.length === 0 ? 'var(--accent-5)' : 'transparent',
            color: selectedRatios.length === 0 ? 'white' : 'var(--text-secondary)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          All
        </button>
        {card.ratios.map(ratio => (
          <button
            key={ratio}
            onClick={() => onToggle(ratio)}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: '2px solid',
              borderColor: selectedRatios.includes(ratio) ? 'var(--accent-2)' : 'var(--bg-secondary)',
              background: selectedRatios.includes(ratio) ? 'var(--accent-2)' : 'transparent',
              color: selectedRatios.includes(ratio) ? 'white' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            {ratio}
          </button>
        ))}
      </div>
    </div>
  );
}
