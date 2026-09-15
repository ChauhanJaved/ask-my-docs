import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, MessageSquare, FileText, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function InlineSpinner({
  className,
  size = 18,
  label,
}: {
  className?: string;
  size?: number;
  label?: string;
}) {
  return (
    <div className={cn("inline-flex items-center gap-2 text-neutral-500 dark:text-neutral-400 text-sm font-medium", className)}>
      <Loader2 className="animate-spin text-brand-600 dark:text-brand-400" style={{ width: size, height: size }} />
      {label && <span>{label}</span>}
    </div>
  );
}

export function FullPageSpinner({ label }: { label?: string }) {
  return (
    <div className="min-h-[70vh] w-full flex flex-col items-center justify-center gap-4 py-16 animate-in fade-in-50 duration-300">
      <div className="relative flex items-center justify-center">
        {/* Outer glowing ambient ring */}
        <div className="absolute h-16 w-16 rounded-full bg-brand-500/20 dark:bg-brand-500/10 blur-lg animate-pulse" />
        {/* Spinning track ring */}
        <div className="h-12 w-12 rounded-full border-2 border-brand-200 dark:border-neutral-800 border-t-brand-600 dark:border-t-brand-500 animate-spin shadow-sm" />
        {/* Central subtle icon indicator */}
        <Sparkles className="absolute h-5 w-5 text-brand-600 dark:text-brand-400 animate-pulse" />
      </div>
      {label && (
        <p className="text-xs font-medium tracking-wide uppercase text-neutral-400 dark:text-neutral-500 animate-pulse">
          {label}
        </p>
      )}
    </div>
  );
}

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200/80 dark:border-neutral-800/80 pb-5">
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
            <div key={i} className="rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/50 dark:bg-neutral-900/50 p-5 space-y-3 shadow-xs">
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
      <div className="rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900 p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-200/60 dark:border-neutral-800/60">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
        
        <div className="space-y-3 pt-2">
          {Array.from({ length: tableRows }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-neutral-200/40 dark:border-neutral-800/40 last:border-0">
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

export function ChatHistorySkeleton() {
  return (
    <div className="space-y-6 w-full animate-in fade-in-50 duration-300">
      <div className="flex justify-between items-center border-b border-neutral-200/80 dark:border-neutral-800/80 pb-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-28" />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border border-neutral-200/80 dark:border-neutral-800/80 rounded-xl overflow-hidden bg-white dark:bg-neutral-900 shadow-xs">
            <div className="bg-neutral-50/80 dark:bg-neutral-950/80 px-4 py-3 border-b border-neutral-200/60 dark:border-neutral-800/60 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-neutral-400 dark:text-neutral-600" />
                <Skeleton className="h-4 w-36" />
              </div>
              <Skeleton className="h-4 w-24 rounded-full" />
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-start">
                <Skeleton className="h-12 w-3/4 sm:w-1/2 rounded-xl" />
              </div>
              <div className="flex justify-end">
                <Skeleton className="h-10 w-2/3 sm:w-1/3 rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DocumentGridSkeleton() {
  return (
    <div className="space-y-6 w-full animate-in fade-in-50 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200/80 dark:border-neutral-800/80 pb-4">
        <div className="space-y-1">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border border-neutral-200/80 dark:border-neutral-800/80 rounded-xl p-5 bg-white dark:bg-neutral-900 space-y-4 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                  <FileText className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-6 w-14 rounded-full" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/60 flex items-center justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-20 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MarketingPageSkeleton() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 animate-in fade-in-50 duration-300">
      {/* Hero Skeleton */}
      <div className="text-center space-y-4 max-w-3xl mx-auto pt-8">
        <div className="flex justify-center">
          <Skeleton className="h-7 w-48 rounded-full" />
        </div>
        <Skeleton className="h-12 w-3/4 mx-auto rounded-lg" />
        <Skeleton className="h-5 w-2/3 mx-auto" />
        <div className="flex justify-center gap-3 pt-4">
          <Skeleton className="h-11 w-36 rounded-xl" />
          <Skeleton className="h-11 w-32 rounded-xl" />
        </div>
      </div>

      {/* Feature Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/60 dark:bg-neutral-900/60 p-6 space-y-4">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function OnboardingPageSkeleton() {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-12 space-y-8 animate-in fade-in-50 duration-300">
      {/* Step Indicator Skeleton */}
      <div className="flex items-center justify-between max-w-md mx-auto">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-1 flex-1 mx-2" />
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-1 flex-1 mx-2" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>

      {/* Main Form Card Skeleton */}
      <div className="border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl bg-white dark:bg-neutral-900 p-8 space-y-6 shadow-sm">
        <div className="space-y-2 text-center">
          <Skeleton className="h-7 w-48 mx-auto" />
          <Skeleton className="h-4 w-72 mx-auto" />
        </div>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
        <Skeleton className="h-11 w-full rounded-xl pt-2" />
      </div>
    </div>
  );
}
