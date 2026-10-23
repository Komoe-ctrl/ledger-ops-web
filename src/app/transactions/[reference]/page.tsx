import { Suspense } from "react";
import { AuditView } from "@/components/audit-view";
import { Skeleton } from "@/components/ui/skeleton";

// `params` n'est pas attendu ici (donnée dynamique) : la promesse descend dans le composant client,
// derrière Suspense, pour que le reste de la page reste dans la coquille statique.
export default function TransactionAuditPage({ params }: { params: Promise<{ reference: string }> }) {
  return (
    <Suspense fallback={<Skeleton className="m-6 h-40" />}>
      <AuditView params={params} />
    </Suspense>
  );
}
