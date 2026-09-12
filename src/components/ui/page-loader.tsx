import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardPageSkeleton({
  title = true,
  statCards = 3,
  tableRows = 4,
}: {
  title?: boolean;
  statCards?: number;
  tableRows?: number;
}) {
  return (
    <div className="space-y-6 w-full animate-in fade-in-50 duration-300">
      {/* Header skeleton */}
      {title && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 sm:w-64" />
            <Skeleton className="h-4 w-72 sm:w-96" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
        </div>
      )}

      {/* Stat Cards Skeleton */}
      {statCards > 0 && (
        <div className={`grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(statCards, 4)}`}>
          {Array.from({ length: statCards }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/60 bg-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-3 w-36" />
            </div>
          ))}
        </div>
      )}

      {/* Main Content / Table Skeleton */}
      <div className="rounded-xl border border-border/60 bg-card p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border/30">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
        
        <div className="space-y-3 pt-2">
          {Array.from({ length: tableRows }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32 sm:w-48" />
                  <Skeleton className="h-3 w-24 sm:w-36" />
                </div>
              </div>
              <Skeleton className="h-6 w-16 sm:w-24 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function InlineSpinner({
  className,
  size = 20,
  label,
}: {
  className?: string;
  size?: number;
  label?: string;
}) {
  return (
    <div className={cn("inline-flex items-center gap-2 text-muted-foreground text-sm font-medium", className)}>
      <Loader2 className="animate-spin text-primary" style={{ width: size, height: size }} />
      {label && <span>{label}</span>}
    </div>
  );
}

export function FullPageSpinner({ label = "Loading page..." }: { label?: string }) {
  return (
    <div className="min-h-[400px] w-full flex flex-col items-center justify-center gap-3 py-12">
      <div className="relative flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
      </div>
      <p className="text-sm text-muted-foreground font-medium animate-pulse">{label}</p>
    </div>
  );
}
