export function ProgressBar({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="h-3 w-full rounded-full bg-surface/70 shadow-clay-inset" role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
      <div
        className="h-full rounded-full bg-sage-ink/80 transition-[width]"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
