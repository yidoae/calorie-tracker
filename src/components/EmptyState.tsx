import type { ReactNode } from "react";

interface Props {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/** Centered icon + message for lists with nothing in them yet. */
export default function EmptyState({ icon, title, description, action, className = "" }: Props) {
  return (
    <div className={`flex flex-col items-center rounded-xl border border-dashed border-border-strong px-6 py-10 text-center ${className}`}>
      <div aria-hidden className="mb-3 flex size-10 items-center justify-center rounded-lg border border-border bg-surface text-fg-subtle shadow-xs [&_svg]:size-5">
        {icon}
      </div>
      <p className="text-sm font-medium text-fg">{title}</p>
      {description && <p className="mt-1 max-w-xs text-[13px] text-fg-subtle">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
