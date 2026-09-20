import { Skeleton } from "@/components/Skeleton";

export default function CirclesLoading() {
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-5 px-4 py-8">
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-3 w-16" />
      </header>

      <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <Skeleton className="mb-3 h-3 w-20" />
        <Skeleton className="h-11 w-full" />
      </section>

      <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <Skeleton className="mb-3 h-3 w-24" />
        <Skeleton className="h-11 w-full" />
      </section>
    </main>
  );
}
