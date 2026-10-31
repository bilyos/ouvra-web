export default function SearchLoading() {
  return (
    <div className="space-y-6 animate-pulse p-4 md:p-6">
      <div className="h-12 rounded-xl bg-gray-200 dark:bg-gray-800" />
      <div className="flex gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-9 w-24 rounded-full bg-gray-100 dark:bg-gray-800" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-56 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900" />
        ))}
      </div>
    </div>
  );
}
