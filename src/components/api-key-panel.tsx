"use client";

import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiKey, setApiKey, subscribeApiKey } from "@/lib/api/api-key";

// Clés de démo : à fournir via .env.local (NEXT_PUBLIC_DEMO_MERCHANT_KEY / _ANALYST_KEY).
// Ce sont des clés publiques de démonstration, volontairement sans privilège d'écriture sensible.
const DEMO_KEYS = {
  MERCHANT: process.env.NEXT_PUBLIC_DEMO_MERCHANT_KEY ?? "",
  ANALYST: process.env.NEXT_PUBLIC_DEMO_ANALYST_KEY ?? "",
};

export function useApiKey(): string | null {
  return useSyncExternalStore(subscribeApiKey, getApiKey, () => null);
}

export function ApiKeyPanel() {
  const current = useApiKey();
  const [draft, setDraft] = useState("");

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        setApiKey(draft.trim() || null);
      }}
    >
      <Input
        type="password"
        autoComplete="off"
        placeholder={current ? "Clé enregistrée (session)" : "Clé API"}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="w-64"
      />
      <Button type="submit" disabled={!draft.trim()}>
        Utiliser
      </Button>
      {(["MERCHANT", "ANALYST"] as const).map((role) => (
        <Button
          key={role}
          type="button"
          variant="outline"
          disabled={!DEMO_KEYS[role]}
          title={DEMO_KEYS[role] ? undefined : `NEXT_PUBLIC_DEMO_${role}_KEY non défini`}
          onClick={() => {
            setDraft(DEMO_KEYS[role]);
            setApiKey(DEMO_KEYS[role]);
          }}
        >
          Clé démo {role}
        </Button>
      ))}
      {current && (
        <Button type="button" variant="ghost" onClick={() => { setDraft(""); setApiKey(null); }}>
          Effacer
        </Button>
      )}
    </form>
  );
}
