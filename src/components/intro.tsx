"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApiKeyLabel } from "@/lib/api/use-api-key";

export function Intro() {
  const label = useApiKeyLabel();

  return (
    <section aria-label="Présentation" className="flex flex-col gap-4">
      <p className="max-w-3xl text-base leading-relaxed">
        <strong>ledger-ops</strong> est un back-office de paiement mobile money (Orange Money, MTN MoMo, Wave, Moov — simulés). Chaque
        transaction suit une machine à états, chaque mouvement d&apos;argent est inscrit au grand livre en <strong>partie double</strong>{" "}
        (les débits égalent toujours les crédits), et les écarts avec les relevés des opérateurs sont rapprochés et justifiés. Les règles
        d&apos;intégrité vivent dans la base, pas dans le code.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card size="sm">
          <CardHeader>
            <CardTitle>Clé MERCHANT · vue marchand</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Ses propres paiements et remboursements, avec leur chronologie. Le détail comptable interne n&apos;est pas exposé aux
            marchands, et le rapprochement leur est fermé.
          </CardContent>
        </Card>
        <Card size="sm" className="ring-2 ring-primary/40">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>Clé ANALYST · vue complète</CardTitle>
            <Badge>Recommandée pour la démo</Badge>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Toute la plateforme : indicateurs, écritures comptables équilibrées de chaque transaction, et file de rapprochement où l&apos;on
            résout les exceptions avec une justification.
          </CardContent>
        </Card>
      </div>

      {label === "MERCHANT" && (
        <p role="note" className="text-sm text-muted-foreground">
          Vous consultez la vue marchand. Pour la démonstration complète : <em>Changer</em>, puis <em>Clé démo ANALYST</em>.
        </p>
      )}
    </section>
  );
}
