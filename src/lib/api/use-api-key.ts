"use client";

import { useSyncExternalStore } from "react";
import { getApiKey, getApiKeyLabel, subscribeApiKey } from "./api-key";

export function useApiKey(): string | null {
  return useSyncExternalStore(subscribeApiKey, getApiKey, () => null);
}

export function useApiKeyLabel(): string | null {
  return useSyncExternalStore(subscribeApiKey, getApiKeyLabel, () => null);
}
