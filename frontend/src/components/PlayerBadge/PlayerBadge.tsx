import styles from './PlayerBadge.module.scss';

interface PlayerBadgeProps {
  displayName: string;
  assetKey?: string;
  color?: 'black' | 'white' | null;
  score?: number;
  isActive?: boolean;
  isLocal?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function PlayerBadge({
  displayName,
  assetKey,
  color,
  score,
  isActive = false,
  isLocal = false,
  size = 'md',
}: PlayerBadgeProps) {
  return (
    <div className={`${styles.badge} ${styles[size]} ${isActive ? styles.active : ''} ${isLocal ? styles.local : ''}`}>
      <div className={styles.avatarSection}>
        <div className={styles.avatar}>
          {assetKey ? (
            <img
              src={`/assets/${assetKey}`}
              alt={displayName}
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${displayName}`;
              }}
            />
          ) : (
            <span className={styles.avatarPlaceholder}>
              {displayName.charAt(0)}
            </span>
          )}
        </div>
        {color && (
          <div className={`${styles.colorDot} ${styles[color]}`} />
        )}
      </div>
      <div className={styles.info}>
        <div className={styles.nameRow}>
          <span className={styles.name}>{displayName}</span>
          {isLocal && <span className={styles.youTag}>VOCÊ</span>}
        </div>
        {score !== undefined && (
          <span className={styles.score}>{score}</span>
        )}
      </div>
      {isActive && <div className={styles.turnIndicator} />}
    </div>
  );
}
