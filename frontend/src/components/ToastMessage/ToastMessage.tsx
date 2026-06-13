/* ============================================
   OTHELLO MOBILE WEB - ToastMessage Component
   ============================================ */

import { useEffect } from 'react';
import styles from './ToastMessage.module.scss';

interface ToastMessageProps {
  message: string;
  type?: 'info' | 'error' | 'success' | 'warning';
  visible: boolean;
  onClose: () => void;
  duration?: number;
}

export default function ToastMessage({
  message,
  type = 'info',
  visible,
  onClose,
  duration = 3000,
}: ToastMessageProps) {
  useEffect(() => {
    if (visible && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onClose]);

  if (!visible) return null;

  return (
    <div className={`${styles.toast} ${styles[type]}`}>
      <span className={styles.icon}>
        {type === 'error' && '✕'}
        {type === 'success' && '✓'}
        {type === 'warning' && '⚠'}
        {type === 'info' && 'ℹ'}
      </span>
      <span className={styles.message}>{message}</span>
    </div>
  );
}
