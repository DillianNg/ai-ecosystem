export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-24" role="status" aria-label="Loading">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-violet-500 dark:border-zinc-700 dark:border-t-violet-400" />
    </div>
  );
}
