import { useEffect, useRef, useState } from 'react';
import styles from './TimerDisplay.module.scss';

interface TimerDisplayProps {
  remainingSeconds: number;
  isActive: boolean;
  color?: 'black' | 'white';
  className?: string;
}

export default function TimerDisplay({
  remainingSeconds,
  isActive,
  color,
  className = '',
}: TimerDisplayProps) {
  const [displaySeconds, setDisplaySeconds] = useState(remainingSeconds);
  const lastUpdateRef = useRef(remainingSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    lastUpdateRef.current = remainingSeconds;
    setDisplaySeconds(remainingSeconds);
  }, [remainingSeconds]);

  useEffect(() => {
    if (isActive && displaySeconds > 0) {
      intervalRef.current = setInterval(() => {
        setDisplaySeconds((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, displaySeconds]);

  const minutes = Math.floor(displaySeconds / 60);
  const seconds = displaySeconds % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const isWarning = displaySeconds <= 15 && displaySeconds > 5;
  const isDanger = displaySeconds <= 5;

  return (
    <div
      className={`${styles.timer} ${isActive ? styles.active : ''} ${isWarning ? styles.warning : ''} ${isDanger ? styles.danger : ''} ${color ? styles[color] : ''} ${className}`}
    >
      {color && (
        <div className={`${styles.colorIndicator} ${styles[color]}`} />
      )}
      <span className={styles.time}>{timeStr}</span>
    </div>
  );
}
