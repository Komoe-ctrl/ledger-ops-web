import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ApiError } from "@/lib/api/client";

/** 401/403/404 et pannes réseau affichés comme un bandeau, jamais comme un plantage de page. */
export function ErrorNotice({ error, what }: { error: unknown; what: string }) {
  const status = error instanceof ApiError ? error.status : undefined;
  const message =
    status === 401
      ? "Clé API absente, invalide ou révoquée."
      : status === 403
        ? `Votre rôle n'a pas accès à ${what}.`
        : status === 404
          ? `${what.charAt(0).toUpperCase()}${what.slice(1)} : introuvable.`
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
