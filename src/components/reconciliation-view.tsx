"use client";

import Link from "next/link";
import { Fragment, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ErrorNotice } from "@/components/error-notice";
import { ApiError, type ReconciliationException } from "@/lib/api/client";
import { useReconciliationExceptions, useResolveException } from "@/lib/api/queries";
import { useApiKey } from "@/lib/api/use-api-key";
import { asText, EXCEPTION_KIND_LABELS, formatDateTime, STATUS_LABELS } from "@/lib/format";

function TransactionCell({ exception }: { exception: ReconciliationException }) {
  const reference = asText(exception.transactionReference);
  if (reference) {
    return (
      <Link href={`/transactions/${encodeURIComponent(reference)}`} className="font-mono text-xs underline-offset-4 hover:underline">
        {reference}
      </Link>
    );
  }
  // MISSING_LOCALLY : par définition, aucune transaction locale ne correspond.
  const providerReference = asText(exception.providerReference);
  return (
    <span className="text-xs text-muted-foreground">
      Aucune{providerReference ? ` (réf. opérateur ${providerReference})` : ""}
    </span>
  );
}

function describe(exception: ReconciliationException): string {
  if (exception.reportedStatus) return `L'opérateur annonce : ${STATUS_LABELS[exception.reportedStatus]}`;
  return asText(exception.detail) ?? "—";
}

function ResolveForm({ exception, onDone }: { exception: ReconciliationException; onDone: () => void }) {
  const [resolution, setResolution] = useState("");
  const resolve = useResolveException();
  const blank = resolution.trim() === "";

  return (
    <form
      className="flex flex-col gap-2 py-1"
      onSubmit={(e) => {
        e.preventDefault();
        if (blank) return;
        resolve.mutate({ id: exception.id, resolution: resolution.trim() }, { onSuccess: onDone });
      }}
    >
      <label className="text-sm font-medium" htmlFor={`resolution-${exception.id}`}>
        Justification (obligatoire)
      </label>
      <textarea
        id={`resolution-${exception.id}`}
        required
        maxLength={2000}
        rows={3}
        value={resolution}
        onChange={(e) => setResolution(e.target.value)}
        placeholder="Ex. confirmé côté opérateur (rapport du jour), écriture corrigée manuellement."
        className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      {resolve.isError && (
        <p role="alert" className="text-sm text-destructive">
          {resolve.error instanceof ApiError
            ? resolve.error.status === 403
              ? "Votre rôle ne permet pas de résoudre une exception."
              : resolve.error.status === 409
                ? "Cette exception a déjà été résolue : la liste va être rafraîchie."
                : `Échec de la résolution (${resolve.error.status}) : ${resolve.error.message}`
            : "API injoignable : la résolution n'a pas été enregistrée."}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={blank || resolve.isPending}>
          {resolve.isPending ? "Enregistrement…" : "Confirmer la résolution"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone} disabled={resolve.isPending}>
          Annuler
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Une résolution est définitive : elle ne peut être ni modifiée ni annulée.</p>
    </form>
  );
}

export function ReconciliationView() {
  const apiKey = useApiKey();
  const exceptions = useReconciliationExceptions(apiKey);
  const [tab, setTab] = useState<"open" | "resolved">("open");
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const all = exceptions.data ?? [];
  const open = all.filter((e) => !asText(e.resolvedAt));
  const resolved = all.filter((e) => asText(e.resolvedAt));

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold">Rapprochement</h1>
        <p className="text-sm text-muted-foreground">Écarts entre nos transactions et ce que rapportent les opérateurs.</p>
      </header>

      {!apiKey ? (
        <Alert>
          <AlertTitle>Saisissez une clé API</AlertTitle>
          <AlertDescription>Cet écran requiert une clé de rôle ANALYST (ou ADMIN).</AlertDescription>
        </Alert>
      ) : exceptions.isError ? (
        <ErrorNotice error={exceptions.error} what="le rapprochement (rôle ANALYST ou ADMIN requis)" />
      ) : (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
            <CardTitle>Exceptions</CardTitle>
            <div className="flex gap-1" role="tablist" aria-label="État des exceptions">
              <Button
                role="tab"
                aria-selected={tab === "open"}
                size="sm"
                variant={tab === "open" ? "secondary" : "ghost"}
                onClick={() => setTab("open")}
              >
                Ouvertes{exceptions.data ? ` (${open.length})` : ""}
              </Button>
              <Button
                role="tab"
                aria-selected={tab === "resolved"}
                size="sm"
                variant={tab === "resolved" ? "secondary" : "ghost"}
                onClick={() => setTab("resolved")}
              >
                Résolues{exceptions.data ? ` (${resolved.length})` : ""}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {exceptions.isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : tab === "open" ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Transaction</TableHead>
                    <TableHead>Constat</TableHead>
                    <TableHead>Détectée le</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {open.map((e) => (
                    <Fragment key={e.id}>
                      <TableRow>
                        <TableCell>
                          <Badge variant="secondary">{EXCEPTION_KIND_LABELS[e.kind]}</Badge>
                        </TableCell>
                        <TableCell>
                          <TransactionCell exception={e} />
                        </TableCell>
                        <TableCell className="max-w-sm whitespace-normal">{describe(e)}</TableCell>
                        <TableCell className="tabular-nums">{formatDateTime(e.detectedAt)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            aria-expanded={resolvingId === e.id}
                            onClick={() => setResolvingId(resolvingId === e.id ? null : e.id)}
                          >
                            Résoudre
                          </Button>
                        </TableCell>
                      </TableRow>
                      {resolvingId === e.id && (
                        <TableRow>
                          <TableCell colSpan={5} className="whitespace-normal bg-muted/30">
                            <ResolveForm exception={e} onDone={() => setResolvingId(null)} />
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))}
                  {open.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Aucune exception ouverte.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Transaction</TableHead>
                    <TableHead>Justification</TableHead>
                    <TableHead>Résolue par</TableHead>
                    <TableHead>Résolue le</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resolved.map((e) => {
                    const resolvedAt = asText(e.resolvedAt);
                    return (
                      <TableRow key={e.id}>
                        <TableCell>
                          <Badge variant="secondary">{EXCEPTION_KIND_LABELS[e.kind]}</Badge>
                        </TableCell>
                        <TableCell>
                          <TransactionCell exception={e} />
                        </TableCell>
                        <TableCell className="max-w-sm whitespace-normal">{asText(e.resolution) ?? "—"}</TableCell>
                        {/* Libellé de la clé uniquement : jamais l'identifiant (resolvedBy) de la clé. */}
                        <TableCell>{e.resolvedByLabel ?? "Clé inconnue"}</TableCell>
                        <TableCell className="tabular-nums">{resolvedAt ? formatDateTime(resolvedAt) : "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                  {resolved.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Aucune exception résolue pour le moment.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </main>
  );
}
