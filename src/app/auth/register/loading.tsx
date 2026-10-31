export default function RegisterLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center py-12">
      <div className="w-full max-w-md space-y-6 animate-pulse px-4">
        <div className="mx-auto h-10 w-10 rounded-xl bg-brand-200 dark:bg-brand-950/40" />
        <div className="mx-auto h-6 w-40 rounded-lg bg-gray-200 dark:bg-gray-800" />
        <div className="space-y-4 rounded-xl border border-border bg-card p-6">
          <div className="flex gap-3">
            <div className="h-10 flex-1 rounded-xl bg-muted" />
            <div className="h-10 flex-1 rounded-xl bg-muted" />
          </div>
          <div className="h-10 rounded-xl bg-muted" />
          <div className="h-10 rounded-xl bg-muted" />
          <div className="h-10 rounded-xl bg-muted" />
          <div className="h-12 rounded-xl bg-brand-200 dark:bg-brand-950/40" />
        </div>
        <div className="mx-auto h-4 w-56 rounded bg-muted/60" />
      </div>
    </div>
  );
}
