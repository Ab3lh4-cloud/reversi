import styles from './ScoreBoard.module.scss';

interface ScoreBoardProps {
  blackScore: number;
  whiteScore: number;
  currentTurnColor: 'black' | 'white' | null;
  className?: string;
}

export default function ScoreBoard({
  blackScore,
  whiteScore,
  currentTurnColor,
  className = '',
}: ScoreBoardProps) {
  return (
    <div className={`${styles.board} ${className}`}>
      <div className={`${styles.side} ${styles.black} ${currentTurnColor === 'black' ? styles.activeTurn : ''}`}>
        <div className={styles.discIcon}>
          <div className={styles.blackDisc} />
        </div>
        <span className={styles.score}>{blackScore}</span>
      </div>
      <div className={styles.divider}>
        <span className={styles.vs}>VS</span>
      </div>
      <div className={`${styles.side} ${styles.white} ${currentTurnColor === 'white' ? styles.activeTurn : ''}`}>
        <span className={styles.score}>{whiteScore}</span>
        <div className={styles.discIcon}>
          <div className={styles.whiteDisc} />
        </div>
      </div>
    </div>
  );
}
