import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
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
