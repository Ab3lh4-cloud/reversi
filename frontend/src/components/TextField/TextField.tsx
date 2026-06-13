import styles from './TextField.module.scss';

interface TextFieldProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export default function TextField({
  label,
  placeholder,
  value,
  onChange,
  maxLength = 4,
  error,
  disabled = false,
  autoFocus = false,
  className = '',
}: TextFieldProps) {
  return (
    <div className={`${styles.field} ${error ? styles.hasError : ''} ${className}`}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.inputWrapper}>
        <input
          type="text"
          className={styles.input}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          maxLength={maxLength}
          disabled={disabled}
          autoFocus={autoFocus}
          autoComplete="off"
        />
        <span className={styles.counter}>
          {value.length}/{maxLength}
        </span>
      </div>
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
