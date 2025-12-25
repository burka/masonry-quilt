import type { QuickStartCard as QuickStartCardType } from './types';

interface Props {
  card: QuickStartCardType;
}

export function QuickStartCard({ card }: Props) {
  return (
    <div className="card quickstart-card" style={{
      background: 'var(--bg-card)',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <h3 style={{
        color: 'var(--accent-2)',
        fontSize: '14px',
        fontWeight: 600,
        marginBottom: '12px',
        textTransform: 'uppercase',
        letterSpacing: '1px'
      }}>
        ⚡ Quick Start
      </h3>
      <pre className="font-mono" style={{
        background: '#1e1e1e',
        color: '#d4d4d4',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '11px',
        overflow: 'auto',
        flex: 1,
        margin: 0,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word'
      }}>
        {card.code}
      </pre>
    </div>
  );
}
