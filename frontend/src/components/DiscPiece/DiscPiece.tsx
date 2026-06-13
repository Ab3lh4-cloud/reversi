import { useEffect, useState } from 'react';
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
  const [showColor, setShowColor] = useState(color);

  useEffect(() => {
    if (isFlipping && flipDirection) {
      const timer = setTimeout(() => {
        setShowColor(flipDirection === 'black-to-white' ? 'white' : 'black');
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setShowColor(color);
    }
  }, [color, isFlipping, flipDirection]);

  const flipClass = isFlipping && flipDirection
    ? flipDirection === 'black-to-white'
      ? styles.flipBlackToWhite
      : styles.flipWhiteToBlack
    : '';

  return (
    <div
      className={`${styles.disc} ${styles[showColor]} ${flipClass} ${isNew ? styles.new : ''}`}
      style={{ width: size, height: size }}
    >
      <div className={styles.inner} />
    </div>
  );
}
