import { cn } from "@/lib/utils";
import { STATUS_LABELS } from "@/lib/format";

// Lecture rapide : vert = abouti, ambre = en cours, rouge = échec, gris = expiré,
// bleu = argent rendu, orange/rose = litige. Le libellé et le point restent présents :
// la couleur seule ne porte jamais l'information.
const STYLES: Record<string, string> = {
  SUCCEEDED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  INITIATED: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  EXPIRED: "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  PARTIALLY_REFUNDED: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  REFUNDED: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  DISPUTED: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  REVERSED: "bg-rose-200 text-rose-900 dark:bg-rose-950 dark:text-rose-300",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium",
        STYLES[status] ?? "bg-muted text-muted-foreground",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
