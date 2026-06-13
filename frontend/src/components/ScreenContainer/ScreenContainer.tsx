import styles from './ScreenContainer.module.scss';

interface ScreenContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function ScreenContainer({ children, className = '' }: ScreenContainerProps) {
  return (
    <div className={`${styles.container} ${className}`}>
      {children}
    </div>
  );
}
