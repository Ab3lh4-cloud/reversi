import styles from './AvatarCard.module.scss';

interface AvatarCardProps {
  assetKey: string;
  name: string;
  selected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function AvatarCard({
  assetKey,
  name,
  selected = false,
  onClick,
  size = 'md',
}: AvatarCardProps) {
  return (
    <button
      type="button"
      className={`${styles.card} ${styles[size]} ${selected ? styles.selected : ''}`}
      onClick={onClick}
      aria-label={`Selecionar avatar ${name}`}
    >
      <div className={styles.avatarWrapper}>
        <div className={styles.avatarBg} />
        <img
          src={`/assets/${assetKey}`}
          alt={name}
          className={styles.avatar}
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`;
          }}
        />
        {selected && (
          <div className={styles.selectedBadge}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
      </div>
      <span className={styles.name}>{name}</span>
    </button>
  );
}
