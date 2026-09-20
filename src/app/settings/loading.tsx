import { Skeleton } from "@/components/Skeleton";

export default function SettingsLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-2 h-10 w-full max-w-md" />
        <Skeleton className="mt-3 h-4 w-3/4" />
        <div className="mt-6 flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[70px] w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="mt-6 h-10 w-full rounded-lg" />
      </div>
    </main>
  );
}
