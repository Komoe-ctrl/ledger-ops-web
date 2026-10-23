// Les montants arrivent en chaîne (unité mineure, ADR 0002). Aucun calcul : on ne fait que
// regrouper les chiffres par milliers, par manipulation de texte.
export function formatAmount(amount: string, currency: string): string {
  const grouped = amount.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${grouped} ${currency === "XOF" ? "FCFA" : currency}`;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "medium" });
}

export const STATUS_LABELS: Record<string, string> = {
  INITIATED: "Initiée",
  PENDING: "En attente",
  SUCCEEDED: "Réussie",
  FAILED: "Échouée",
  EXPIRED: "Expirée",
  PARTIALLY_REFUNDED: "Remb. partiel",
  REFUNDED: "Remboursée",
  DISPUTED: "Litige",
  REVERSED: "Annulée",
};

export const PROVIDER_LABELS: Record<string, string> = {
  ORANGE_MONEY: "Orange Money",
  MTN_MOMO: "MTN MoMo",
  WAVE: "Wave",
  MOOV_MONEY: "Moov Money",
};

export const EXCEPTION_KIND_LABELS: Record<string, string> = {
  LATE_ACKNOWLEDGMENT: "Acquittement tardif",
  MISSING_IN_STATEMENT: "Absente du relevé",
  MISSING_LOCALLY: "Absente chez nous",
  AMOUNT_MISMATCH: "Écart de montant",
};

export const ACTOR_LABELS: Record<string, string> = {
  USER: "Utilisateur",
  SYSTEM: "Système",
  PROVIDER: "Opérateur",
};

export const DIRECTION_LABELS: Record<string, string> = {
  DEBIT: "Débit",
  CREDIT: "Crédit",
};

/**
 * TEMPORAIRE — contournement de https://github.com/Komoe-ctrl/ledger-ops-api/issues/36
 * Le contrat OpenAPI type certains champs nullables en `object` (nextCursor, et les champs
 * nullables de ReconciliationExceptionResponseDto) alors qu'ils sont des chaînes ; on ne garde
 * ici que les chaînes, sans rien supposer d'autre.
 *
 * À RETIRER quand #36 est corrigée : relancer `npm run api:fetch`, vérifier que ces champs sont
 * typés `string | null` dans schema.d.ts, puis supprimer asText() et ses appels (reconciliation-view.tsx)
 * ainsi que le cast de `nextCursor` dans lib/api/queries.ts (asCursor).
 */
export function asText(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}
