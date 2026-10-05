interface Props {
  className?: string;
}

/**
 * FitBot's avatar: a small robot pressing a dumbbell overhead. Inline SVG so it needs no network,
 * follows the theme (body in currentColor, eyes/chest light in the accent) and scales crisply.
 */
export default function FitBotAvatar({ className = "" }: Props) {
  return (
    <span aria-hidden className={`inline-flex shrink-0 items-center justify-center rounded-full bg-cta text-ink ${className}`}>
      <svg viewBox="0 0 48 48" className="size-[78%]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        {/* Dumbbell */}
        <path d="M9 9h30" strokeWidth={2.5} />
        <rect x={6} y={4.5} width={4} height={9} rx={1} fill="currentColor" stroke="none" />
        <rect x={38} y={4.5} width={4} height={9} rx={1} fill="currentColor" stroke="none" />
        <rect x={3} y={6.5} width={2.5} height={5} rx={0.75} fill="currentColor" stroke="none" />
        <rect x={42.5} y={6.5} width={2.5} height={5} rx={0.75} fill="currentColor" stroke="none" />
        {/* Arms */}
        <path d="M17 30l-4-8 2-13" strokeWidth={2.5} />
        <path d="M31 30l4-8-2-13" strokeWidth={2.5} />
        {/* Antenna + head */}
        <path d="M24 17v-3" strokeWidth={2} />
        <circle cx={24} cy={13} r={1.3} fill="currentColor" stroke="none" />
        <rect x={17} y={17} width={14} height={10} rx={3} fill="currentColor" stroke="none" />
        <circle cx={21} cy={22} r={1.5} className="fill-cta" stroke="none" />
        <circle cx={27} cy={22} r={1.5} className="fill-cta" stroke="none" />
        {/* Body, chest light and legs */}
        <rect x={16} y={28.5} width={16} height={10} rx={3} fill="currentColor" stroke="none" />
        <circle cx={24} cy={33.5} r={1.8} className="fill-cta" stroke="none" />
        <rect x={18.5} y={39} width={4} height={5.5} rx={1} fill="currentColor" stroke="none" />
        <rect x={25.5} y={39} width={4} height={5.5} rx={1} fill="currentColor" stroke="none" />
      </svg>
    </span>
  );
}
