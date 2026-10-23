// La clé reste dans le navigateur (sessionStorage), jamais envoyée à un serveur Next.
const STORAGE_KEY = "ledger-ops.api-key";
const LABEL_STORAGE_KEY = "ledger-ops.api-key-label";
let current: string | null = null;
let currentLabel: string | null = null;
let loaded = false;
const listeners = new Set<() => void>();

function load(): void {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    current = window.sessionStorage.getItem(STORAGE_KEY);
    currentLabel = window.sessionStorage.getItem(LABEL_STORAGE_KEY);
  } catch {
    /* stockage indisponible : on reste en mémoire */
  }
}

export function getApiKey(): string | null {
  load();
  return current;
}

/** Rôle connu de la clé (clés de démonstration seulement) ; null pour une clé collée à la main. */
export function getApiKeyLabel(): string | null {
  load();
  return currentLabel;
}

export function setApiKey(key: string | null, label: string | null = null): void {
  loaded = true;
  current = key;
  currentLabel = key ? label : null;
  try {
    if (key) {
      window.sessionStorage.setItem(STORAGE_KEY, key);
      if (label) window.sessionStorage.setItem(LABEL_STORAGE_KEY, label);
      else window.sessionStorage.removeItem(LABEL_STORAGE_KEY);
    } else {
      window.sessionStorage.removeItem(STORAGE_KEY);
      window.sessionStorage.removeItem(LABEL_STORAGE_KEY);
    }
  } catch {
    /* ignoré */
  }
  listeners.forEach((l) => l());
}

export function subscribeApiKey(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}
