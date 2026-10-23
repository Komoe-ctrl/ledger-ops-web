// Les montants arrivent en chaîne (unité mineure, ADR 0002). Aucun calcul : on ne fait que
// regrouper les chiffres par milliers, par manipulation de texte.
export function formatAmount(amount: string, currency: string): string {
  const grouped = amount.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
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
