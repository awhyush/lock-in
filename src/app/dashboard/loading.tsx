import { Skeleton } from "@/components/Skeleton";

export default function DashboardLoading() {
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-5 px-4 py-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-10 w-52" />
        </div>
        <div className="flex flex-col items-end gap-2">
          <Skeleton className="h-8 w-10" />
          <Skeleton className="h-3 w-16" />
        </div>
      </header>

      <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <Skeleton className="mb-3 h-3 w-16" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[60px] w-full" />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <Skeleton className="mb-3 h-3 w-24" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <Skeleton className="h-3 w-24" />
      </section>
    </main>
  );
}
