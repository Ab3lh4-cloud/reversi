import { Avatar } from '../../types';
import AvatarCard from '../AvatarCard/AvatarCard';
import styles from './AvatarGrid.module.scss';

interface AvatarGridProps {
  avatars: Avatar[];
  selectedId: string | null;
  onSelect: (avatar: Avatar) => void;
  loading?: boolean;
  error?: string | null;
}

export default function AvatarGrid({
  avatars,
  selectedId,
  onSelect,
  loading = false,
  error = null,
}: AvatarGridProps) {
  if (loading) {
    return (
      <div className={styles.grid}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={styles.skeleton} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <span className={styles.errorIcon}>⚠</span>
        <span>{error}</span>
      </div>
    );
  }

  if (avatars.length === 0) {
    return (
      <div className={styles.empty}>
        <span>Nenhum avatar disponível</span>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {avatars.map((avatar, index) => (
        <AvatarCard
          key={avatar.id}
          assetKey={avatar.assetKey}
          name={avatar.name}
          selected={selectedId === avatar.id}
          disabled={!!avatar.inUse}
          onClick={() => !avatar.inUse && onSelect(avatar)}
          size="md"
        />
      ))}
    </div>
  );
}
