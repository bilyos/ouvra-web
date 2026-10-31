export default function ProviderProfileLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-pulse p-4 md:p-6 pt-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start gap-5">
        <div className="h-24 w-24 rounded-full bg-gray-200 dark:bg-gray-800" />
        <div className="flex-1 space-y-3">
          <div className="h-7 w-48 rounded-lg bg-gray-200 dark:bg-gray-800" />
          <div className="h-4 w-32 rounded bg-muted/60" />
          <div className="flex gap-2">
            <div className="h-6 w-20 rounded-full bg-brand-100 dark:bg-brand-950/30" />
            <div className="h-6 w-16 rounded-full bg-muted/60" />
          </div>
        </div>
      </div>

      {/* About */}
      <div className="space-y-3 rounded-xl border border-border bg-card p-6">
        <div className="h-5 w-24 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-4 w-full rounded bg-muted/60" />
        <div className="h-4 w-3/4 rounded bg-muted/60" />
      </div>

      {/* Services */}
      <div className="space-y-3 rounded-xl border border-border bg-card p-6">
        <div className="h-5 w-28 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="grid gap-3 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted/60" />
          ))}
        </div>
      </div>

      {/* Reviews */}
      <div className="space-y-3 rounded-xl border border-border bg-card p-6">
        <div className="h-5 w-20 rounded bg-gray-200 dark:bg-gray-800" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-3 py-3 border-t border-border first:border-0">
            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-800" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-28 rounded bg-gray-200 dark:bg-gray-800" />
              <div className="h-3 w-full rounded bg-muted/60" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
