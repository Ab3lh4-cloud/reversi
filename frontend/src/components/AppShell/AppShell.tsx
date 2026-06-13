import styles from './AppShell.module.scss';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className={styles.shell}>
      <div className={styles.background}>
        <div className={styles.bgOrb1} />
        <div className={styles.bgOrb2} />
        <div className={styles.bgGrid} />
      </div>
      <main className={styles.content}>
        {children}
      </main>
    </div>
  );
}
