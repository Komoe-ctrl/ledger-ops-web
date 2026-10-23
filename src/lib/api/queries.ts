import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap, type Provider, type TransactionStatus } from "./client";

const PAGE_SIZE = 20;

// nextCursor est typé `object` par le contrat (le décorateur Swagger ne précise pas le type) ;
// c'est une chaîne opaque à renvoyer telle quelle.
const asCursor = (c: unknown): string | undefined => (typeof c === "string" ? c : undefined);

export function useTransactions(apiKey: string | null, filters: { status?: TransactionStatus; provider?: Provider }) {
  return useInfiniteQuery({
    queryKey: ["transactions", apiKey, filters],
    enabled: !!apiKey,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) =>
      unwrap(
        await api.GET("/v1/transactions", {
          params: { query: { ...filters, cursor: pageParam, limit: PAGE_SIZE } },
        }),
      ),
    getNextPageParam: (last) => asCursor(last.nextCursor),
  });
}

/** Agrégats calculés en SQL côté API, scopés par rôle : aucune pagination côté navigateur. */
export function useStats(apiKey: string | null) {
  return useQuery({
    queryKey: ["stats", apiKey],
    enabled: !!apiKey,
    queryFn: async () => unwrap(await api.GET("/v1/stats", {})),
  });
}

export function useReconciliationExceptions(apiKey: string | null) {
  return useQuery({
    queryKey: ["reconciliation-exceptions", apiKey],
    enabled: !!apiKey,
    queryFn: async () => unwrap(await api.GET("/v1/reconciliation-exceptions", {})),
  });
}

/** Justification obligatoire côté API aussi (400 si vide) ; l'erreur remonte telle quelle à l'écran. */
export function useResolveException() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, resolution }: { id: string; resolution: string }) =>
      unwrap(await api.PATCH("/v1/reconciliation-exceptions/{id}/resolve", { params: { path: { id } }, body: { resolution } })),
    onSuccess: async () => {
      // Les cartes du tableau de bord (exceptions ouvertes, taux) dépendent aussi de cette résolution.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["reconciliation-exceptions"] }),
        queryClient.invalidateQueries({ queryKey: ["stats"] }),
      ]);
    },
  });
}

export function useTransactionAudit(apiKey: string | null, reference: string) {
  return useQuery({
    queryKey: ["transaction-audit", apiKey, reference],
    enabled: !!apiKey,
    queryFn: async () => unwrap(await api.GET("/v1/transactions/{reference}/audit", { params: { path: { reference } } })),
  });
}
