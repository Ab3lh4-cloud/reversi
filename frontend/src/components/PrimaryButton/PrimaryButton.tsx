import styles from './PrimaryButton.module.scss';

interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit';
  variant?: 'default' | 'danger' | 'success';
  fullWidth?: boolean;
  className?: string;
}

export default function PrimaryButton({
  children,
  onClick,
  disabled = false,
  loading = false,
  type = 'button',
  variant = 'default',
  fullWidth = true,
  className = '',
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      className={`${styles.button} ${styles[variant]} ${fullWidth ? styles.fullWidth : ''} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <span className={styles.loader}>
          <span className={styles.spinner} />
          <span>Carregando...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
