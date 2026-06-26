export function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-shimmer rounded-md ${className}`}
      style={{
        background: "linear-gradient(90deg, #1a1d26 25%, #232733 50%, #1a1d26 75%)",
        backgroundSize: "200% 100%"
      }}
    />
  );
}

export function SkeletonKpis() {
  return (
    <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3 lg:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border-soft bg-panel p-[18px]">
          <Skeleton className="mb-3 h-3 w-2/3" />
          <Skeleton className="h-7 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTabla({ filas = 5 }) {
  return (
    <div className="space-y-2 rounded-xl border border-border-soft bg-panel p-4">
      {Array.from({ length: filas }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonCards({ cantidad = 8 }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: cantidad }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border-soft bg-panel p-4">
          <Skeleton className="mb-2 h-4 w-3/4" />
          <Skeleton className="mb-4 h-3 w-1/3" />
          <div className="mb-4 grid grid-cols-3 gap-2">
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
          </div>
          <Skeleton className="h-8 w-full" />
        </div>
      ))}
    </div>
  );
}