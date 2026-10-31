export default function MessagesLoading() {
  return (
    <div className="flex h-[calc(100vh-10rem)] animate-pulse gap-4">
      <div className="w-80 space-y-3 rounded-xl border border-border bg-card p-4">
        <div className="h-10 rounded-xl bg-muted" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-800" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-800" />
              <div className="h-3 w-40 rounded bg-muted/60" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex-1 rounded-xl border border-border bg-card" />
    </div>
  );
}
