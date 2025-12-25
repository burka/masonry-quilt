interface CodeCard {
  type: 'code';
  id: string;
  title: string;
  language: string;
  code: string;
}

interface Props {
  card: CodeCard;
}

export function CodeCard({ card }: Props) {
  return (
    <div className="card code-card" style={{
      background: 'var(--bg-card)',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      overflow: 'hidden'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h4 style={{
          color: 'var(--accent-3)',
          fontSize: '12px',
          fontWeight: 600,
          margin: 0,
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          {card.title}
        </h4>
        <span style={{
          color: 'var(--text-secondary)',
          fontSize: '10px',
          background: 'var(--bg-secondary)',
          padding: '2px 8px',
          borderRadius: '4px'
        }}>
          {card.language}
        </span>
      </div>
      <pre className="font-mono" style={{
        background: '#1a1a2e',
        color: '#e0e0e0',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '11px',
        overflow: 'auto',
        margin: 0,
        flex: 1,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        lineHeight: 1.5
      }}>
        <code>{card.code}</code>
      </pre>
    </div>
  );
}
