// components/LoadingSkeleton.tsx
export default function LoadingSkeleton({ type = 'list', count = 3 }: { type?: 'card' | 'table' | 'list'; count?: number }) {
  if (type === 'card') {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="animate-pulse bg-white dark:bg-slate-800 rounded-lg p-4">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-3"></div>
            <div className="flex justify-between items-center">
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/6"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-12"></div>
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded flex-1"></div>
          </div>
        ))}
      </div>
    );
  }

  // list
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse bg-white dark:bg-slate-800 rounded p-3">
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
        </div>
      ))}
    </div>
  );
}