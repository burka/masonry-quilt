interface DemoItemCard {
  type: 'demo-item';
  id: string;
  emoji: string;
  color: string;
}

interface Props {
  card: DemoItemCard;
  colSpan: number;
  rowSpan: number;
  gap: number;
}

export function DemoItemCard({ card, colSpan, rowSpan, gap }: Props) {
  const area = colSpan * rowSpan;
  let fontSize = 24;
  if (area >= 16) fontSize = 48;
  else if (area >= 9) fontSize = 40;
  else if (area >= 4) fontSize = 32;
  else if (area >= 2) fontSize = 28;

  return (
    <div className="card demo-item-card" style={{
      background: card.color,
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      color: 'white',
      height: '100%',
      borderRadius: `${Math.max(0, gap / 2)}px`
    }}>
      <span style={{ fontSize: `${fontSize}px` }}>{card.emoji}</span>
      <span style={{
        background: 'rgba(0,0,0,0.2)',
        padding: '4px 8px',
        borderRadius: '8px',
        fontSize: '12px',
        fontWeight: 600
      }}>
        {colSpan}×{rowSpan}
      </span>
    </div>
  );
}
