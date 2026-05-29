interface SkeletonProps {
  className?: string;
}

/**
 * Generic skeleton block for optimistic loading UI.
 * Compose multiple Skeletons to mimic the final layout.
 */
export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={`animate-pulse rounded-md bg-slate-200/80 ${className}`}
    />
  );
}
