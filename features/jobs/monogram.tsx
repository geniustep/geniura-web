import { cn } from "@/lib/utils";

// Tinted tiles cycle by name so neighbouring cards differ; no logo is ever invented for a company.
const tones = [
  "bg-secondary text-secondary-foreground",
  "bg-success-soft text-success",
  "bg-warning-soft text-warning",
  "bg-muted text-subtle-foreground",
] as const;

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.slice(0, 2).map((word) => Array.from(word)[0] ?? "");
  return letters.join("").toLocaleUpperCase();
}

export function Monogram({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  const hash = Array.from(name).reduce((sum, char) => sum + (char.codePointAt(0) ?? 0), 0);
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-display font-bold",
        size === "lg" ? "size-18 rounded-2xl text-2xl" : "size-13 rounded-[0.875rem] text-lg",
        tones[hash % tones.length],
      )}
    >
      <bdi>{initials(name)}</bdi>
    </span>
  );
}
