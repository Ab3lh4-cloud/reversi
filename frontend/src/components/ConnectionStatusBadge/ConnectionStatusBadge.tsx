import styles from './ConnectionStatusBadge.module.scss';

interface ConnectionStatusBadgeProps {
  connected: boolean;
  opponentDisconnected?: boolean;
  className?: string;
}

export default function ConnectionStatusBadge({
  connected,
  opponentDisconnected = false,
  className = '',
}: ConnectionStatusBadgeProps) {
  if (!connected) {
    return (
      <div className={`${styles.badge} ${styles.disconnected} ${className}`}>
        <span className={styles.dot} />
        <span>Desconectado</span>
      </div>
    );
  }

  if (opponentDisconnected) {
    return (
      <div className={`${styles.badge} ${styles.opponentOffline} ${className}`}>
        <span className={styles.dot} />
        <span>Oponente desconectado</span>
      </div>
    );
  }

  return (
    <div className={`${styles.badge} ${styles.connected} ${className}`}>
      <span className={styles.dot} />
      <span>Conectado</span>
    </div>
  );
}
