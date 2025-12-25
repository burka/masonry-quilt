import type { HeroCard as HeroCardType } from './types';

interface Props {
  card: HeroCardType;
}

export function HeroCard({ card }: Props) {
  return (
    <div className="card hero-card" style={{
      background: 'linear-gradient(135deg, var(--accent-5), var(--accent-1))',
      color: 'white'
    }}>
      <h1 style={{
        fontSize: 'clamp(24px, 5vw, 48px)',
        fontWeight: 700,
        margin: 0,
        textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
      }}>
        {card.title}
      </h1>
      <p style={{
        fontSize: 'clamp(12px, 2vw, 18px)',
        opacity: 0.95,
        margin: '12px 0 0'
      }}>
        {card.subtitle}
      </p>
      {card.version && (
        <span style={{
          background: 'rgba(255,255,255,0.2)',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '14px',
          marginTop: '12px',
          display: 'inline-block'
        }}>
          v{card.version}
        </span>
      )}
    </div>
  );
}
