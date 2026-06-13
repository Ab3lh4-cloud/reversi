import styles from './ValidMoveMarker.module.scss';

interface ValidMoveMarkerProps {
  size?: number;
}

export default function ValidMoveMarker({ size = 36 }: ValidMoveMarkerProps) {
  return (
    <div
      className={styles.marker}
      style={{ width: size, height: size }}
    >
      <div className={styles.inner} />
    </div>
  );
}
