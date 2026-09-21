import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[var(--radius-md)] bg-border/80 dark:bg-border",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
