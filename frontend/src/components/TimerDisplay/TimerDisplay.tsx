import { useEffect, useState } from 'react';
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

  // Sincronizar com valor do servidor (reset após cada jogada ou troca de turno)
  useEffect(() => {
    setDisplaySeconds(remainingSeconds);
  }, [remainingSeconds]);

  // Contar regressivamente — reinicia apenas quando remainingSeconds muda (nova jogada)
  // Não depende de displaySeconds para não recriar o interval a cada tick
  useEffect(() => {
    if (remainingSeconds <= 0) return;
    const id = setInterval(() => {
      setDisplaySeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [remainingSeconds]);

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
