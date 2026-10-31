export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-gray-200 dark:bg-gray-800" />
      <div className="h-4 w-64 rounded bg-muted/60" />
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-xl border border-border bg-card" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="h-80 rounded-xl border border-border bg-card lg:col-span-2" />
        <div className="h-80 rounded-xl border border-border bg-card" />
      </div>
    </div>
  );
}
