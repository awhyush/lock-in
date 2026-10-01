export function Avatar({ name, className = "" }: { name: string; className?: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      className={`flex h-12 w-12 flex-none items-center justify-center rounded-full bg-sage font-black text-lg text-sage-ink shadow-clay-sage ${className}`}
      aria-hidden
    >
      {initial}
    </span>
  );
}
