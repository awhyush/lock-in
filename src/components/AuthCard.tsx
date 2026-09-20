import { ThemeToggle } from "@/components/ThemeToggle";

export function AuthCard({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted">{eyebrow}</p>
            <h1 className="font-display text-4xl font-extrabold leading-[0.9] tracking-wide">{title}</h1>
          </div>
          <ThemeToggle className="mt-1 flex-none" />
        </div>
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">{children}</div>
      </div>
    </main>
  );
}
