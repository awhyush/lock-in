import { Skeleton } from "@/components/Skeleton";

export default function DashboardLoading() {
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-5 px-4 py-8 pb-32">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-10 w-52" />
        </div>
        <Skeleton className="h-12 w-12 rounded-full" />
      </header>

      <section className="rounded-[2.5rem] border border-line bg-surface p-5 shadow-soft">
        <Skeleton className="mb-3 h-3 w-16" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[60px] w-full rounded-[1.5rem]" />
          ))}
        </div>
      </section>

      <section className="rounded-[2.5rem] border border-line bg-surface p-5 shadow-soft">
        <Skeleton className="mb-3 h-3 w-24" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </section>

      <section className="rounded-[2.5rem] border border-line bg-surface p-5 shadow-soft">
        <Skeleton className="h-3 w-24" />
      </section>
    </main>
  );
}
