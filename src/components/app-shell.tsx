"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { ApiKeyPanel } from "@/components/api-key-panel";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Tableau de bord" },
  { href: "/reconciliation", label: "Rapprochement" },
];

const linkClass = "rounded-md px-2.5 py-1 text-sm hover:bg-muted";

function MainNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1" aria-label="Navigation principale">
      {LINKS.map(({ href, label }) => {
        // L'audit d'une transaction se rattache au tableau de bord (on y arrive depuis une ligne).
        const active = href === "/" ? pathname === "/" || pathname.startsWith("/transactions") : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(linkClass, active ? "bg-muted font-medium" : "text-muted-foreground")}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

// Repli sans état « actif » : le chemin courant est une donnée d'exécution (Suspense requis au prérendu).
function MainNavFallback() {
  return (
    <nav className="flex gap-1" aria-label="Navigation principale">
      {LINKS.map(({ href, label }) => (
        <Link key={href} href={href} className={cn(linkClass, "text-muted-foreground")}>
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3">
          <div className="flex items-center gap-6">
            <span className="font-semibold">ledger-ops</span>
            <Suspense fallback={<MainNavFallback />}>
              <MainNav />
            </Suspense>
          </div>
          <ApiKeyPanel />
        </div>
      </header>
      {children}
    </>
  );
}
