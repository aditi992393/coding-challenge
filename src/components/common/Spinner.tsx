import styles from "./Spinner.module.css";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
}

export function Spinner({ size = "md", label = "Loading" }: SpinnerProps) {
  return (
    <div role="status" aria-live="polite" className={styles.wrapper}>
      <span className={`${styles.spinner} ${styles[size]}`} />
      <span className="sr-only">{label}</span>
    </div>
  );
}
