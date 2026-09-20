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
            <p className="font-bold text-[10px] uppercase tracking-[0.16em] text-sage">{eyebrow}</p>
            <h1 className="font-black text-[32px] leading-[1.05] tracking-tight text-ink">{title}</h1>
          </div>
          <ThemeToggle className="mt-1 flex-none" />
        </div>
        <div className="rounded-[2.5rem] border border-line bg-surface p-6 shadow-soft">{children}</div>
      </div>
    </main>
  );
}
