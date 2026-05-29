interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
}

const sizeMap = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-4",
};

export function Spinner({ size = "md", label = "Loading" }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="inline-flex items-center gap-2"
    >
      <span
        className={`${sizeMap[size]} animate-spin rounded-full border-brand-500 border-t-transparent`}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
