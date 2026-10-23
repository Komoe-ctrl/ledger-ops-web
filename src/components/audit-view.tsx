"use client";

import Link from "next/link";
import { use } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ErrorNotice } from "@/components/error-notice";
import { StatusBadge } from "@/components/status-badge";
import { useTransactionAudit } from "@/lib/api/queries";
import { useApiKey } from "@/lib/api/use-api-key";
import { ACTOR_LABELS, formatAmount, formatDateTime, PROVIDER_LABELS } from "@/lib/format";
import { cn } from "@/lib/utils";

const DISPUTE_STATUSES = ["DISPUTED", "REVERSED"];

// Teintes des deux côtés de la partie double. Les libellés « Débit » / « Crédit » sont toujours
// écrits : la couleur aide à lire les colonnes, elle ne porte pas l'information seule.
const DEBIT_TINT = "bg-sky-50 dark:bg-sky-950/30";
const CREDIT_TINT = "bg-violet-50 dark:bg-violet-950/30";

function ReferenceLink({ reference }: { reference: string }) {
  return (
    <Link href={`/transactions/${encodeURIComponent(reference)}`} className="font-mono text-xs underline-offset-4 hover:underline">
      {reference}
    </Link>
  );
}

export function AuditView({ params }: { params: Promise<{ reference: string }> }) {
  const { reference: rawReference } = use(params);
  const reference = decodeURIComponent(rawReference);
  const apiKey = useApiKey();
  const audit = useTransactionAudit(apiKey, reference);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <div>
        <Link href="/" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
          ← Tableau de bord
        </Link>
        <h1 className="mt-1 font-mono text-xl font-semibold">{reference}</h1>
      </div>

      {!apiKey ? (
        <Alert>
          <AlertTitle>Saisissez une clé API</AlertTitle>
          <AlertDescription>Une clé est nécessaire pour consulter l&apos;audit d&apos;une transaction.</AlertDescription>
        </Alert>
      ) : audit.isError ? (
        <ErrorNotice error={audit.error} what="cette transaction" />
      ) : audit.isLoading || !audit.data ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <AuditContent audit={audit.data} reference={reference} />
      )}
    </main>
  );
}

type Audit = NonNullable<ReturnType<typeof useTransactionAudit>["data"]>;
type Entry = NonNullable<Audit["entries"]>[number];

/**
 * L'image qui résume le projet : total des débits = total des crédits, face à face.
 * Les deux totaux ET le verdict (`balanced`) viennent de PostgreSQL ; rien n'est additionné ici.
 */
function BalanceStrip({ entry, currency }: { entry: Entry; currency: string }) {
  const ok = entry.balanced;
  const side = (label: string, amount: string, tint: string, align: "start" | "end") => (
    <div className={cn("flex flex-col justify-center rounded-lg px-4 py-3", tint, align === "end" ? "items-end text-right" : "items-start")}>
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-2xl font-semibold tabular-nums">{formatAmount(amount, currency)}</span>
    </div>
  );

  return (
    <div
      role="group"
      aria-label={ok ? "Écriture équilibrée : débits égaux aux crédits" : "Écriture déséquilibrée : débits différents des crédits"}
      className={cn(
        "grid grid-cols-[1fr_auto_1fr] items-stretch gap-3 rounded-xl border-2 p-3",
        ok ? "border-emerald-500/70" : "border-red-500 bg-red-50 dark:bg-red-950/30",
      )}
    >
      {side("Total des débits", entry.totalDebit, DEBIT_TINT, "start")}
      <div className="flex min-w-24 flex-col items-center justify-center">
        <span
          className={cn(
            "flex size-11 items-center justify-center rounded-full text-3xl font-light leading-none text-white",
            ok ? "bg-emerald-600" : "bg-red-600",
          )}
          aria-hidden
        >
          {ok ? "=" : "≠"}
        </span>
        <span className={cn("mt-1 text-xs font-semibold", ok ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400")}>
          {ok ? "Équilibrée" : "Déséquilibrée"}
        </span>
      </div>
      {side("Total des crédits", entry.totalCredit, CREDIT_TINT, "end")}
    </div>
  );
}

function AuditContent({ audit, reference }: { audit: Audit; reference: string }) {
  const { transaction } = audit;
  const currency = transaction.currency;
  const entryCount = audit.entries?.length ?? 0;
  const allBalanced = audit.entries?.every((e) => e.balanced) ?? false;

  return (
    <>
      <Card size="sm">
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Type · opérateur</p>
            <p>
              {transaction.type === "PAYMENT" ? "Paiement" : "Remboursement"} · {PROVIDER_LABELS[transaction.provider]}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Statut</p>
            <StatusBadge status={transaction.status} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Montant</p>
            <p className="text-lg font-semibold tabular-nums">{formatAmount(transaction.amount, currency)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{audit.parentReference ? "Paiement remboursé" : "Déjà remboursé"}</p>
            {audit.parentReference ? (
              <ReferenceLink reference={audit.parentReference} />
            ) : (
              <p className="tabular-nums">{formatAmount(transaction.refundedAmount, currency)}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chronologie des statuts</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="flex flex-col gap-4 border-l pl-5">
            {audit.timeline.map((event, i) => {
              const other = event.transactionReference !== reference;
              const dispute = DISPUTE_STATUSES.includes(event.toStatus);
              return (
                <li key={i} className="relative">
                  <span className="absolute -left-[1.62rem] top-1.5 size-2 rounded-full bg-foreground" aria-hidden />
                  <div className="flex flex-wrap items-center gap-2">
                    <time className="text-sm tabular-nums text-muted-foreground" dateTime={event.createdAt}>
                      {formatDateTime(event.createdAt)}
                    </time>
                    <span className="flex items-center gap-1.5 text-sm">
                      {event.fromStatus ? (
                        <>
                          <StatusBadge status={event.fromStatus} className="opacity-70" />
                          <span aria-hidden>→</span>
                          <span className="sr-only">vers</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">Création</span>
                      )}
                      <StatusBadge status={event.toStatus} />
                    </span>
                    {dispute && <Badge variant="destructive">{event.toStatus === "REVERSED" ? "Litige perdu" : "Litige ouvert"}</Badge>}
                    {other && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        {event.transactionType === "REFUND" ? "Remboursement" : "Transaction liée"}{" "}
                        <ReferenceLink reference={event.transactionReference} />
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {ACTOR_LABELS[event.actorType]}
                    {event.actorId ? ` · ${event.actorId}` : ""}
                    {event.reason ? <span className="italic"> — {event.reason}</span> : null}
                  </p>
                </li>
              );
            })}
          </ol>
          {audit.refunds.length > 0 && (
            <p className="mt-4 text-sm text-muted-foreground">
              {audit.refunds.length} remboursement{audit.refunds.length > 1 ? "s" : ""} :{" "}
              {audit.refunds.map((r, i) => (
                <span key={r.reference}>
                  {i > 0 && ", "}
                  <ReferenceLink reference={r.reference} /> (<span className="tabular-nums">{formatAmount(r.amount, r.currency)}</span>)
                </span>
              ))}
            </p>
          )}
        </CardContent>
      </Card>

      <section className="flex flex-col gap-4" aria-label="Écritures comptables">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Écritures comptables</h2>
          {audit.entries !== null && entryCount > 0 && (
            <Badge variant={allBalanced ? "secondary" : "destructive"}>
              {allBalanced
                ? `${entryCount} écriture${entryCount > 1 ? "s" : ""} · toutes équilibrées`
                : "Au moins une écriture déséquilibrée"}
            </Badge>
          )}
        </div>

        {audit.entries === null ? (
          <Alert>
            <AlertTitle>Détail comptable non exposé</AlertTitle>
            <AlertDescription>
              Le détail comptable interne n&apos;est pas exposé aux marchands : comptes de compensation, commissions et contre-écritures
              relèvent de la plateforme. Utilisez la clé ANALYST pour voir les écritures et leur équilibre.
            </AlertDescription>
          </Alert>
        ) : audit.entries.length === 0 ? (
          <Alert>
            <AlertTitle>Aucune écriture</AlertTitle>
            <AlertDescription>Aucune écriture comptable n&apos;est posée tant que la transaction n&apos;a pas abouti.</AlertDescription>
          </Alert>
        ) : (
          audit.entries.map((entry) => {
            const entryCurrency = entry.postings[0]?.currency ?? currency;
            return (
              <Card key={entry.id}>
                <CardHeader>
                  <CardTitle>{entry.description}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    <span className="tabular-nums">{formatDateTime(entry.createdAt)}</span>
                    {entry.transactionReference !== reference && (
                      <>
                        {" · "}
                        <ReferenceLink reference={entry.transactionReference} />
                      </>
                    )}
                  </p>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <BalanceStrip entry={entry} currency={entryCurrency} />
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Compte</TableHead>
                        <TableHead className={cn("w-48 text-right", DEBIT_TINT)}>Débit</TableHead>
                        <TableHead className={cn("w-48 text-right", CREDIT_TINT)}>Crédit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entry.postings.map((p, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            {p.accountName} <span className="font-mono text-xs text-muted-foreground">{p.accountCode}</span>
                          </TableCell>
                          <TableCell className={cn("text-right tabular-nums", DEBIT_TINT)}>
                            {p.direction === "DEBIT" ? formatAmount(p.amount, p.currency) : ""}
                          </TableCell>
                          <TableCell className={cn("text-right tabular-nums", CREDIT_TINT)}>
                            {p.direction === "CREDIT" ? formatAmount(p.amount, p.currency) : ""}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell className="font-semibold">Totaux</TableCell>
                        <TableCell className={cn("text-right font-semibold tabular-nums", DEBIT_TINT)}>
                          {formatAmount(entry.totalDebit, entryCurrency)}
                        </TableCell>
                        <TableCell className={cn("text-right font-semibold tabular-nums", CREDIT_TINT)}>
                          {formatAmount(entry.totalCredit, entryCurrency)}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </CardContent>
              </Card>
            );
          })
        )}
      </section>
    </>
  );
}
