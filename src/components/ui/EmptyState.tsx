import type { ReactNode } from "react";

interface Props {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  lang?: string;
}

/** Centered icon + message for lists with nothing in them yet. */
export default function EmptyState({ icon, title, description, action, className = "", lang }: Props) {
  return (
    <div lang={lang} className={`flex flex-col items-center rounded-[10px] border border-dashed border-border-strong bg-surface-2 px-6 py-12 text-center ${className}`}>
      <div aria-hidden className="mb-4 flex size-12 items-center justify-center rounded-[10px] bg-ink text-cta [&_svg]:size-6">
        {icon}
      </div>
      <p className="font-display text-base text-fg">{title}</p>
      {description && <p className="mt-2 max-w-xs text-[13px] text-fg-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
