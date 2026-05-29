import styles from "./Skeleton.module.css";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Generic skeleton block for optimistic loading UI.
 * Compose multiple Skeletons to mimic the final layout.
 */
export function Skeleton({ className = "", style }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={`${styles.skeleton} ${className}`}
      style={style}
    />
  );
}
