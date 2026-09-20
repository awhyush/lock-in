export function Avatar({ name, className = "" }: { name: string; className?: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      className={`flex h-12 w-12 flex-none items-center justify-center rounded-full border-2 border-surface bg-ink font-black text-lg text-ground shadow-soft ${className}`}
      aria-hidden
    >
      {initial}
    </span>
  );
}
