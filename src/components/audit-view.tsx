"use client";

import Link from "next/link";
import { use } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ErrorNotice } from "@/components/error-notice";
import { useTransactionAudit } from "@/lib/api/queries";
import { useApiKey } from "@/lib/api/use-api-key";
import { ACTOR_LABELS, formatAmount, formatDateTime, PROVIDER_LABELS, STATUS_LABELS } from "@/lib/format";

const DISPUTE_STATUSES = ["DISPUTED", "REVERSED"];

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

function AuditContent({ audit, reference }: { audit: Audit; reference: string }) {
  const { transaction } = audit;
  const currency = transaction.currency;

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
            <Badge variant="secondary">{STATUS_LABELS[transaction.status]}</Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Montant</p>
            <p className="tabular-nums">{formatAmount(transaction.amount, currency)}</p>
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
                    {event.fromStatus ? (
                      <span className="flex items-center gap-1 text-sm">
                        <Badge variant="outline">{STATUS_LABELS[event.fromStatus]}</Badge>→
                        <Badge variant="secondary">{STATUS_LABELS[event.toStatus]}</Badge>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-sm">
                        Création<Badge variant="secondary">{STATUS_LABELS[event.toStatus]}</Badge>
                      </span>
                    )}
                    {dispute && <Badge variant="destructive">Litige</Badge>}
                    {other && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        {event.transactionType === "REFUND" ? "Remboursement" : "Transaction liée"} <ReferenceLink reference={event.transactionReference} />
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
        <h2 className="text-lg font-semibold">Écritures comptables</h2>
        {audit.entries === null ? (
          <Alert>
            <AlertTitle>Écritures réservées</AlertTitle>
            <AlertDescription>
              Le plan comptable interne n&apos;est visible que des rôles ANALYST, OPERATOR et ADMIN.
            </AlertDescription>
          </Alert>
        ) : audit.entries.length === 0 ? (
          <Alert>
            <AlertTitle>Aucune écriture</AlertTitle>
            <AlertDescription>Aucune écriture comptable n&apos;est posée tant que la transaction n&apos;a pas abouti.</AlertDescription>
          </Alert>
        ) : (
          audit.entries.map((entry) => (
            <Card key={entry.id} size="sm">
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
                <div>
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
                </div>
                {entry.balanced ? (
                  <Badge variant="secondary">Équilibrée · débits = crédits</Badge>
                ) : (
                  <Badge variant="destructive">Déséquilibrée · débits ≠ crédits</Badge>
                )}
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Compte</TableHead>
                      <TableHead className="text-right">Débit</TableHead>
                      <TableHead className="text-right">Crédit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entry.postings.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          {p.accountName} <span className="font-mono text-xs text-muted-foreground">{p.accountCode}</span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {p.direction === "DEBIT" ? formatAmount(p.amount, p.currency) : ""}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {p.direction === "CREDIT" ? formatAmount(p.amount, p.currency) : ""}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell className="font-medium">Totaux</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{formatAmount(entry.totalDebit, currency)}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{formatAmount(entry.totalCredit, currency)}</TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </CardContent>
            </Card>
          ))
        )}
      </section>
    </>
  );
}
