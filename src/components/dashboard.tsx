"use client";

import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApiKeyPanel, useApiKey } from "@/components/api-key-panel";
import { ApiError, type Provider, type TransactionStatus } from "@/lib/api/client";
import { useStats, useTransactions } from "@/lib/api/queries";
import { formatAmount, formatDateTime, PROVIDER_LABELS, STATUS_LABELS } from "@/lib/format";

const selectClass =
  "h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

function ErrorNotice({ error, what }: { error: unknown; what: string }) {
  const status = error instanceof ApiError ? error.status : undefined;
  const message =
    status === 401
      ? "Clé API absente, invalide ou révoquée."
      : status === 403
        ? `Votre rôle n'a pas accès à ${what}.`
        : error instanceof ApiError
          ? error.message
          : "API injoignable. Vérifiez qu'elle tourne et que CORS l'autorise.";
  return (
    <Alert variant={status === 403 ? "default" : "destructive"}>
      <AlertTitle>{status ? `Erreur ${status}` : "Erreur réseau"}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

function Kpi({ title, value, hint, loading }: { title: string; value: string; hint?: string; loading?: boolean }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className={`text-2xl font-semibold ${value === "Indisponible" || value === "Réservé" ? "text-muted-foreground" : ""}`}>
            {value}
          </div>
        )}
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

const IN_PROGRESS = ["INITIATED", "PENDING"];
const NOT_SUCCEEDED = ["FAILED", "EXPIRED"];

// Rapport de deux comptages entiers fournis par l'API (jamais de montants).
function successRate(byStatus: { status: string; count: number }[]): string {
  const settled = byStatus.filter((c) => !IN_PROGRESS.includes(c.status));
  const total = settled.reduce((acc, c) => acc + c.count, 0);
  if (total === 0) return "—";
  const failed = settled.filter((c) => NOT_SUCCEEDED.includes(c.status)).reduce((acc, c) => acc + c.count, 0);
  return `${(((total - failed) / total) * 100).toFixed(1)} %`;
}

function reconciliationRate(rec: { settledTransactions: number; reconciledTransactions: number }): string {
  if (rec.settledTransactions === 0) return "—";
  return `${((rec.reconciledTransactions / rec.settledTransactions) * 100).toFixed(1)} %`;
}

export function Dashboard() {
  const apiKey = useApiKey();
  const [status, setStatus] = useState<TransactionStatus | "">("");
  const [provider, setProvider] = useState<Provider | "">("");

  const stats = useStats(apiKey);
  const list = useTransactions(apiKey, { status: status || undefined, provider: provider || undefined });

  const rows = list.data?.pages.flatMap((p) => p.data) ?? [];
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-3">
        <div>
          <h1 className="text-2xl font-semibold">ledger-ops — démonstration</h1>
          <p className="text-sm text-muted-foreground">
            {stats.data?.demoDatasetLoadedAt
              ? `Jeu de démonstration chargé le ${formatDateTime(stats.data.demoDatasetLoadedAt)}`
              : "Jeu de démonstration : date de chargement indisponible"}
          </p>
        </div>
        <ApiKeyPanel />
      </header>

      {!apiKey ? (
        <Alert>
          <AlertTitle>Saisissez une clé API</AlertTitle>
          <AlertDescription>Collez une clé ou utilisez l&apos;un des boutons de clé de démonstration.</AlertDescription>
        </Alert>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi
              title="Volume"
              loading={stats.isLoading}
              value={stats.data ? `${stats.data.totalTransactions} transactions` : "Indisponible"}
              hint={stats.data?.scope === "MERCHANT" ? "Votre marchand uniquement." : "Toute la plateforme."}
            />
            <Kpi
              title="Taux de réussite"
              loading={stats.isLoading}
              value={stats.data ? successRate(stats.data.payments.byStatus) : "Indisponible"}
              hint="Paiements dénoués non échoués ni expirés (hors en cours)."
            />
            <Kpi
              title="Taux de rapprochement"
              loading={stats.isLoading}
              value={stats.data?.reconciliation ? reconciliationRate(stats.data.reconciliation) : "Indisponible"}
              hint={
                stats.data?.reconciliation
                  ? `${stats.data.reconciliation.reconciledTransactions} rapprochées sur ${stats.data.reconciliation.settledTransactions} dénouées (jeu de démonstration).`
                  : stats.data?.scope === "MERCHANT"
                    ? "Réservé aux rôles ANALYST, OPERATOR et ADMIN."
                    : "Aucun chargement du jeu de démonstration enregistré."
              }
            />
            <Kpi
              title="Exceptions ouvertes"
              loading={stats.isLoading}
              value={
                stats.data
                  ? stats.data.openReconciliationExceptions === null
                    ? "Réservé"
                    : String(stats.data.openReconciliationExceptions)
                  : "Indisponible"
              }
              hint={stats.data?.openReconciliationExceptions === null ? "Rôle ANALYST, OPERATOR ou ADMIN requis." : undefined}
            />
          </section>
          {stats.isError && <ErrorNotice error={stats.error} what="les indicateurs" />}

          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
              <CardTitle>Transactions</CardTitle>
              <div className="flex gap-2">
                <select
                  aria-label="Statut"
                  className={selectClass}
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TransactionStatus | "")}
                >
                  <option value="">Tous les statuts</option>
                  {Object.entries(STATUS_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
                <select
                  aria-label="Opérateur"
                  className={selectClass}
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as Provider | "")}
                >
                  <option value="">Tous les opérateurs</option>
                  {Object.entries(PROVIDER_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {list.isError ? (
                <ErrorNotice error={list.error} what="les transactions" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Référence</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Opérateur</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Créée le</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.isLoading &&
                      Array.from({ length: 5 }, (_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={6}>
                            <Skeleton className="h-5 w-full" />
                          </TableCell>
                        </TableRow>
                      ))}
                    {rows.map((t) => (
                      <TableRow key={t.reference}>
                        <TableCell className="font-mono text-xs">{t.reference}</TableCell>
                        <TableCell>{t.type === "PAYMENT" ? "Paiement" : "Remboursement"}</TableCell>
                        <TableCell>{PROVIDER_LABELS[t.provider]}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{STATUS_LABELS[t.status]}</Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatAmount(t.amount, t.currency)}</TableCell>
                        <TableCell>{formatDateTime(t.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                    {list.isSuccess && rows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          Aucune transaction.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
              {list.hasNextPage && (
                <Button
                  variant="outline"
                  className="self-center"
                  disabled={list.isFetchingNextPage}
                  onClick={() => list.fetchNextPage()}
                >
                  {list.isFetchingNextPage ? "Chargement…" : "Charger plus"}
                </Button>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </main>
  );
}
