"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { setApiKey } from "@/lib/api/api-key";
import { useApiKey, useApiKeyLabel } from "@/lib/api/use-api-key";

// Clés de démo : à fournir via .env.local (NEXT_PUBLIC_DEMO_MERCHANT_KEY / _ANALYST_KEY).
// Ce sont des clés publiques de démonstration, volontairement sans privilège d'écriture sensible.
const DEMO_KEYS = {
  MERCHANT: process.env.NEXT_PUBLIC_DEMO_MERCHANT_KEY ?? "",
  ANALYST: process.env.NEXT_PUBLIC_DEMO_ANALYST_KEY ?? "",
};

function roleOfDemoKey(key: string): string | null {
  const entry = Object.entries(DEMO_KEYS).find(([, value]) => value !== "" && value === key);
  return entry ? entry[0] : null;
}

export function ApiKeyPanel() {
  const current = useApiKey();
  const label = useApiKeyLabel();
  const [draft, setDraft] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Valide la clé auprès de l'API avant de l'adopter : une clé refusée n'est jamais enregistrée.
  async function adopt(key: string) {
    setChecking(true);
    setError(null);
    try {
      const res = await api.GET("/v1/stats", { headers: { Authorization: `Bearer ${key}` } });
      if (res.response.status === 401) {
        setError("Clé refusée par l'API (absente, invalide ou révoquée).");
        return;
      }
      if (!res.response.ok) {
        setError(`L'API a répondu ${res.response.status}.`);
        return;
      }
      setApiKey(key, roleOfDemoKey(key));
      setDraft("");
    } catch {
      setError("API injoignable.");
    } finally {
      setChecking(false);
    }
  }

  // Une fois la clé validée, elle n'est plus jamais réaffichée, même masquée.
  if (current) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary">{label ? `Clé ${label} active` : "Clé active"}</Badge>
        <Button type="button" variant="ghost" size="sm" onClick={() => setApiKey(null)}>
          Changer
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (draft.trim()) void adopt(draft.trim());
        }}
      >
        <Input
          type="password"
          autoComplete="off"
          placeholder="Clé API"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="w-64"
        />
        <Button type="submit" disabled={!draft.trim() || checking}>
          {checking ? "Vérification…" : "Utiliser"}
        </Button>
        {(["MERCHANT", "ANALYST"] as const).map((role) => (
          <Button
            key={role}
            type="button"
            variant="outline"
            disabled={!DEMO_KEYS[role] || checking}
            title={DEMO_KEYS[role] ? undefined : `NEXT_PUBLIC_DEMO_${role}_KEY non défini`}
            onClick={() => void adopt(DEMO_KEYS[role])}
          >
            Clé démo {role}
          </Button>
        ))}
      </form>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
