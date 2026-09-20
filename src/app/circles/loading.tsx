import { Skeleton } from "@/components/Skeleton";

export default function CirclesLoading() {
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-5 px-4 py-8 pb-32">
      <header className="flex flex-col gap-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-10 w-40" />
      </header>

      <section className="rounded-[2.5rem] border border-line bg-surface p-5 shadow-soft">
        <Skeleton className="mb-3 h-3 w-20" />
        <Skeleton className="h-11 w-full rounded-full" />
      </section>

      <section className="rounded-[2.5rem] border border-line bg-surface p-5 shadow-soft">
        <Skeleton className="mb-3 h-3 w-24" />
        <Skeleton className="h-11 w-full rounded-full" />
      </section>
    </main>
  );
}
