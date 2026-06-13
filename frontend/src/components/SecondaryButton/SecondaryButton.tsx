import styles from './SecondaryButton.module.scss';

interface SecondaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  fullWidth?: boolean;
  className?: string;
}

export default function SecondaryButton({
  children,
  onClick,
  disabled = false,
  type = 'button',
  fullWidth = true,
  className = '',
}: SecondaryButtonProps) {
  return (
    <button
      type={type}
      className={`${styles.button} ${fullWidth ? styles.fullWidth : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
