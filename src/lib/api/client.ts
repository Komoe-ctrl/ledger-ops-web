import createClient, { type Middleware } from "openapi-fetch";
import type { components, paths } from "./schema";
import { getApiKey } from "./api-key";

export type Transaction = components["schemas"]["TransactionResponseDto"];
export type TransactionStatus = Transaction["status"];
export type Provider = Transaction["provider"];
export type ReconciliationException = components["schemas"]["ReconciliationExceptionResponseDto"];
export type ProblemDetails = components["schemas"]["ProblemDetailsDto"];

const withApiKey: Middleware = {
  onRequest({ request }) {
    const key = getApiKey();
    // Un en-tête explicite (validation d'une clé avant de l'adopter) prime sur la clé enregistrée.
    if (key && !request.headers.has("Authorization")) request.headers.set("Authorization", `Bearer ${key}`);
    return request;
  },
};

export const api = createClient<paths>({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000",
});
api.use(withApiKey);

/** Erreur typée : porte le statut HTTP pour que l'UI distingue 401/403 d'une panne. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly problem?: Partial<ProblemDetails>,
  ) {
    super(problem?.detail ?? problem?.title ?? `Erreur HTTP ${status}`);
  }
}

export function unwrap<T>(res: { data?: T; error?: unknown; response: Response }): T {
  if (res.data === undefined) throw new ApiError(res.response.status, res.error as Partial<ProblemDetails>);
  return res.data;
}
