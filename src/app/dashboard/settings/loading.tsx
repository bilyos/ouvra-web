export default function SettingsLoading() {
  return (
    <div className="max-w-2xl space-y-6 animate-pulse">
      <div className="h-8 w-36 rounded-lg bg-gray-200 dark:bg-gray-800" />
      <div className="space-y-4 rounded-xl border border-border bg-card p-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-24 rounded bg-muted/60" />
            <div className="h-10 rounded-xl bg-muted" />
          </div>
        ))}
        <div className="h-12 w-32 rounded-xl bg-brand-200 dark:bg-brand-950/40" />
      </div>
    </div>
  );
}
