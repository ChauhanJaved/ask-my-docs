import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-neutral-200/80 dark:bg-neutral-800/60 transition-colors",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
