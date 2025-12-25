interface FeatureCard {
  type: 'feature';
  id: string;
  icon: string;
  title: string;
  description: string;
  color: string;
}

interface Props {
  card: FeatureCard;
}

export function FeatureCard({ card }: Props) {
  return (
    <div className="card feature-card" style={{
      background: `linear-gradient(135deg, ${card.color}22, ${card.color}11)`,
      borderLeft: `4px solid ${card.color}`,
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <span style={{ fontSize: '32px' }}>{card.icon}</span>
      <h3 style={{
        color: 'var(--text-primary)',
        fontSize: '16px',
        fontWeight: 700,
        margin: 0
      }}>
        {card.title}
      </h3>
      <p style={{
        color: 'var(--text-secondary)',
        fontSize: '13px',
        lineHeight: 1.5,
        margin: 0
      }}>
        {card.description}
      </p>
    </div>
  );
}
