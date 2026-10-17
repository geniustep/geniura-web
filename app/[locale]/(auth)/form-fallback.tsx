import { Skeleton } from "@/components/ui/skeleton";

export function FormFallback() {
  return (
    <div className="grid gap-5" aria-busy="true">
      <Skeleton className="h-10" />
      <Skeleton className="h-10" />
      <Skeleton className="h-12" />
    </div>
  );
}
