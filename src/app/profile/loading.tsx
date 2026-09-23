import { Skeleton } from "@/components/Skeleton";

export default function ProfileLoading() {
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-5 px-4 py-8 pb-32">
      <header className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-40" />
        </div>
      </header>

      <section className="rounded-[2.5rem] border border-line bg-surface p-5 shadow-soft">
        <Skeleton className="mb-3 h-3 w-16" />
        <Skeleton className="h-14 w-full rounded-[1.5rem]" />
      </section>

      <section className="rounded-[2.5rem] border border-line bg-surface p-5 shadow-soft">
        <Skeleton className="mb-3 h-3 w-32" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full rounded-full" />
          ))}
        </div>
      </section>
    </main>
  );
}
