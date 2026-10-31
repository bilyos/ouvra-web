export default function Loading() {
  return (
    <div className="min-h-screen bg-paper" aria-busy="true">
      <div className="mx-auto grid max-w-7xl gap-14 px-4 pb-16 pt-28 sm:px-6 lg:grid-cols-12 lg:px-8 lg:pt-40">
        <div className="space-y-5 lg:col-span-7">
          <div className="h-6 w-72 animate-pulse rounded bg-muted" />
          <div className="h-16 w-4/5 animate-pulse rounded-lg bg-muted" />
          <div className="h-16 w-3/5 animate-pulse rounded-lg bg-muted" />
          <div className="h-14 w-40 animate-pulse rounded-xl bg-sun-200 dark:bg-sun-500/20" />
        </div>
        <div className="hidden h-80 animate-pulse rounded-2xl bg-muted lg:col-span-5 lg:block" />
      </div>
    </div>
  );
}
