import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
}

export function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white/70 py-10 px-6 text-center"
    >
      {icon ? (
        <div aria-hidden className="text-3xl">
          {icon}
        </div>
      ) : null}
      <p className="text-base font-semibold text-slate-700">{title}</p>
      {description ? (
        <p className="max-w-md text-sm text-slate-500">{description}</p>
      ) : null}
    </div>
  );
}
