import { Skeleton } from "@/components/Skeleton";

export default function CircleDetailLoading() {
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-5 px-4 py-8">
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-10 w-52" />
        </div>
        <Skeleton className="h-3 w-12" />
      </header>

      <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <Skeleton className="h-9 w-full" />
      </section>

      <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <Skeleton className="mb-3 h-3 w-20" />
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </section>
    </main>
  );
}
