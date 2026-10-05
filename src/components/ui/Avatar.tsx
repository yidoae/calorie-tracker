/** Round lime initial for a username. */
export default function Avatar({ username, large = false }: { username: string; large?: boolean }) {
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full bg-cta font-display text-cta-fg uppercase ${
        large ? "size-10 text-base" : "size-8 text-sm"
      }`}
    >
      {username.charAt(0)}
    </span>
  );
}
