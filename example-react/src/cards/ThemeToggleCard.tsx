interface ThemeToggleCard {
  type: 'theme-toggle';
  id: string;
}

interface Props {
  card: ThemeToggleCard;
  theme: 'light' | 'dark';
  onToggle: () => void;
}

export function ThemeToggleCard({ card: _card, theme, onToggle }: Props) {
  return (
    <div className="card theme-toggle-card" style={{
      background: theme === 'dark'
        ? 'linear-gradient(135deg, #1a1a2e, #2d1b4e)'
        : 'linear-gradient(135deg, #f0f4ff, #e0e8ff)',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      cursor: 'pointer'
    }} onClick={onToggle}>
      <span style={{ fontSize: '32px' }}>
        {theme === 'dark' ? '🌙' : '☀️'}
      </span>
      <span style={{
        color: 'var(--text-primary)',
        fontWeight: 600,
        fontSize: '14px'
      }}>
        {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
      </span>
      <span style={{
        color: 'var(--text-secondary)',
        fontSize: '11px'
      }}>
        Click to toggle
      </span>
    </div>
  );
}
