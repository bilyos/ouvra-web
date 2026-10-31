export default function ForgotPasswordLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-6 animate-pulse px-4">
        <div className="mx-auto h-10 w-10 rounded-xl bg-brand-200 dark:bg-brand-950/40" />
        <div className="mx-auto h-6 w-52 rounded-lg bg-gray-200 dark:bg-gray-800" />
        <div className="space-y-4 rounded-xl border border-border bg-card p-6">
          <div className="h-4 w-full rounded bg-muted/60" />
          <div className="h-10 rounded-xl bg-muted" />
          <div className="h-12 rounded-xl bg-brand-200 dark:bg-brand-950/40" />
        </div>
      </div>
    </div>
  );
}
