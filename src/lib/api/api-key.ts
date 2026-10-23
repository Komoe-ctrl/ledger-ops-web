// La clé reste dans le navigateur (sessionStorage), jamais envoyée à un serveur Next.
const STORAGE_KEY = "ledger-ops.api-key";
let current: string | null = null;
const listeners = new Set<() => void>();

export function getApiKey(): string | null {
  if (current === null && typeof window !== "undefined") {
    try {
      current = window.sessionStorage.getItem(STORAGE_KEY);
    } catch {
      /* stockage indisponible : on reste en mémoire */
    }
  }
  return current;
}

export function setApiKey(key: string | null): void {
  current = key;
  try {
    if (key) window.sessionStorage.setItem(STORAGE_KEY, key);
    else window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignoré */
  }
  listeners.forEach((l) => l());
}

export function subscribeApiKey(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}
