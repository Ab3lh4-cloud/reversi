import styles from './DiscPiece.module.scss';

interface DiscPieceProps {
  color: 'black' | 'white';
  isFlipping?: boolean;
  flipDirection?: 'black-to-white' | 'white-to-black';
  isNew?: boolean;
  size?: number;
}

export default function DiscPiece({
  color,
  isFlipping = false,
  flipDirection,
  isNew = false,
  size = 36,
}: DiscPieceProps) {
  const flipClass = isFlipping && flipDirection
    ? flipDirection === 'black-to-white'
      ? styles.flipBlackToWhite
      : styles.flipWhiteToBlack
    : '';

  return (
    <div
      className={`${styles.disc} ${styles[color]} ${flipClass} ${isNew ? styles.new : ''}`}
      style={{ width: size, height: size }}
    >
      <div className={styles.inner} />
    </div>
  );
}
