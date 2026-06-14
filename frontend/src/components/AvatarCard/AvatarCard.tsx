import styles from './AvatarCard.module.scss';

interface AvatarCardProps {
  assetKey: string;
  name: string;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function AvatarCard({
  assetKey,
  name,
  selected = false,
  disabled = false,
  onClick,
  size = 'md',
}: AvatarCardProps) {
  return (
    <button
      type="button"
      className={`${styles.card} ${styles[size]} ${selected ? styles.selected : ''} ${disabled ? styles.disabled : ''}`}
      onClick={disabled ? undefined : onClick}
      aria-label={`Avatar ${name}${disabled ? ' (em uso)' : ''}`}
    >
      <div className={styles.avatarWrapper}>
        <div className={styles.avatarBg} />
        <img
          src={`/assets/${assetKey}`}
          alt={name}
          className={styles.avatar}
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(assetKey)}`;
          }}
        />
        {selected && !disabled && (
          <div className={styles.selectedBadge}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
        {disabled && (
          <div className={styles.disabledOverlay}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2.5"/>
              <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
        )}
      </div>
    </button>
  );
}
