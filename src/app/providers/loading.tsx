export default function ProviderDetailLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-pulse p-4 md:p-6">
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 rounded-full bg-gray-200 dark:bg-gray-800" />
        <div className="space-y-2">
          <div className="h-6 w-40 rounded-lg bg-gray-200 dark:bg-gray-800" />
          <div className="h-4 w-28 rounded bg-muted/60" />
        </div>
      </div>
      <div className="h-48 rounded-xl border border-border bg-card" />
      <div className="h-64 rounded-xl border border-border bg-card" />
    </div>
  );
}
