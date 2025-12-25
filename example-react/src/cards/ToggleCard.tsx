interface ToggleControlCard {
  type: 'control-toggle';
  id: string;
  label: string;
  settingKey: string;
}

interface Props {
  card: ToggleControlCard;
  value: boolean;
  onChange: (value: boolean) => void;
}

export function ToggleCard({ card, value, onChange }: Props) {
  return (
    <div className="card toggle-card" style={{
      background: 'var(--bg-card)',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <span style={{
        color: 'var(--text-primary)',
        fontWeight: 600
      }}>
        {card.label}
      </span>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: '56px',
          height: '32px',
          borderRadius: '16px',
          border: 'none',
          background: value ? 'var(--accent-4)' : 'var(--bg-secondary)',
          position: 'relative',
          cursor: 'pointer',
          transition: 'background 0.2s'
        }}
      >
        <span style={{
          position: 'absolute',
          top: '4px',
          left: value ? '28px' : '4px',
          width: '24px',
          height: '24px',
          borderRadius: '12px',
          background: 'white',
          transition: 'left 0.2s',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }} />
      </button>
    </div>
  );
}
