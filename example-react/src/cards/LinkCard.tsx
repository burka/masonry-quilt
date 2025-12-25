interface LinkCard {
  type: 'link';
  id: string;
  icon: string;
  label: string;
  url: string;
  color: string;
}

interface Props {
  card: LinkCard;
}

export function LinkCard({ card }: Props) {
  return (
    <a
      href={card.url}
      target="_blank"
      rel="noopener noreferrer"
      className="card link-card"
      style={{
        background: card.color,
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        textDecoration: 'none',
        color: 'white',
        cursor: 'pointer'
      }}
    >
      <span style={{ fontSize: '32px' }}>{card.icon}</span>
      <span style={{
        fontWeight: 600,
        fontSize: '14px'
      }}>
        {card.label}
      </span>
    </a>
  );
}
