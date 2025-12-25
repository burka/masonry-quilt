interface SliderControlCard {
  type: 'control-slider';
  id: string;
  label: string;
  settingKey: 'cellSize' | 'gap' | 'cardCount' | 'borderRadius';
  min: number;
  max: number;
  step: number;
}

interface Props {
  card: SliderControlCard;
  value: number;
  onChange: (value: number) => void;
}

export function SliderCard({ card, value, onChange }: Props) {
  return (
    <div className="card slider-card" style={{
      background: 'var(--bg-card)',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: '12px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <label style={{
          color: 'var(--text-primary)',
          fontWeight: 600,
          fontSize: '14px'
        }}>
          {card.label}
        </label>
        <span style={{
          color: 'var(--accent-2)',
          fontWeight: 700,
          fontSize: '18px',
          fontFamily: "'JetBrains Mono', monospace"
        }}>
          {value}{card.settingKey === 'cardCount' ? '' : card.settingKey === 'borderRadius' ? 'px' : 'px'}
        </span>
      </div>
      <input
        type="range"
        min={card.min}
        max={card.max}
        step={card.step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: '100%',
          height: '8px',
          borderRadius: '4px',
          background: `linear-gradient(to right, var(--accent-2) 0%, var(--accent-2) ${((value - card.min) / (card.max - card.min)) * 100}%, var(--bg-secondary) ${((value - card.min) / (card.max - card.min)) * 100}%, var(--bg-secondary) 100%)`,
          WebkitAppearance: 'none',
          cursor: 'pointer'
        }}
      />
    </div>
  );
}
