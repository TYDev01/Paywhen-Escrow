"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authedFetch, getAccessToken, logout } from "@/lib/auth-store";
import { getPaymentCapabilities, type PaymentCapabilities } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { StateBadge } from "@/components/dashboard/state-badge";

interface Me {
  displayName: string;
  email: string;
  roles: string[];
  verification: string;
}
interface TxSummary {
  id: string;
  reference: string;
  state: string;
  title: string;
  amountMinor: string;
  currency: string;
  role: string;
  updatedAt: string;
}

function formatAmount(minor: string, currency: string): string {
  const n = BigInt(minor);
  const whole = n / 100n;
  const frac = (n % 100n).toString().padStart(2, "0");
  return `${currency} ${whole.toString()}.${frac}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [me, setMe] = React.useState<Me | null>(null);
  const [txs, setTxs] = React.useState<TxSummary[]>([]);
  const [caps, setCaps] = React.useState<PaymentCapabilities | null>(null);
  const [filter, setFilter] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/login");
      return;
    }
    (async () => {
      try {
        const [meRes, txRes, capsRes] = await Promise.all([
          authedFetch<Me>("/me"),
          authedFetch<TxSummary[]>("/transactions"),
          getPaymentCapabilities().catch(() => null),
        ]);
        setMe(meRes);
        setTxs(txRes);
        setCaps(capsRes);
      } catch {
        setError("Your session has expired. Please log in again.");
        setTimeout(() => router.replace("/login"), 1200);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const filtered = filter ? txs.filter((t) => t.state === filter) : txs;
  const states = Array.from(new Set(txs.map((t) => t.state)));

  if (loading) {
    return (
      <Container className="py-20">
        <div className="h-8 w-48 animate-pulse rounded bg-surface-muted" />
        <div className="mt-6 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-surface-muted" />
          ))}
        </div>
      </Container>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-surface">
        <Container className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-display font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-fg">E</span>
            Escrow
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-fg-muted sm:inline">{me?.email}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await logout();
                router.replace("/login");
              }}
            >
              Log out
            </Button>
          </div>
        </Container>
      </header>

      <Container className="py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">
              Welcome{me ? `, ${me.displayName}` : ""}
            </h1>
            <p className="mt-1 text-sm text-fg-muted">
              Identity verification:{" "}
              <span className="font-medium text-fg">{me?.verification ?? "UNVERIFIED"}</span>
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/new">Create escrow</Link>
          </Button>
        </div>

        {caps && !caps.liveMoneyMovementEnabled && (
          <div className="mt-6 rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-fg-muted">
            <strong className="font-semibold text-fg">Payments not yet configured.</strong>{" "}
            You can create and agree escrow terms now. Funding, payouts and refunds are
            disabled until an approved payment provider is set up.
          </div>
        )}

        {error && (
          <div role="alert" className="mt-6 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </div>
        )}

        {txs.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            <FilterChip active={filter === ""} onClick={() => setFilter("")}>
              All ({txs.length})
            </FilterChip>
            {states.map((s) => (
              <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)}>
                {s.replace(/_/g, " ").toLowerCase()}
              </FilterChip>
            ))}
          </div>
        )}

        <div className="mt-6">
          {filtered.length === 0 ? (
            <EmptyState hasAny={txs.length > 0} />
          ) : (
            <ul className="space-y-3">
              {filtered.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/dashboard/transactions/${t.id}`}
                    className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-primary/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{t.title}</p>
                      <p className="mt-0.5 text-xs text-fg-muted">
                        {t.reference} · you are the {t.role.toLowerCase()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="hidden font-semibold tabular-nums sm:inline">
                        {formatAmount(t.amountMinor, t.currency)}
                      </span>
                      <StateBadge state={t.state} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Container>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
        active ? "border-primary bg-primary text-primary-fg" : "border-border bg-surface text-fg-muted hover:text-fg"
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState({ hasAny }: { hasAny: boolean }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
      <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-xl text-primary" aria-hidden>
        ✦
      </div>
      <h2 className="font-display text-lg font-bold">
        {hasAny ? "No transactions match this filter" : "You have no transactions yet"}
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-fg-muted">
        {hasAny
          ? "Try a different status filter."
          : "Create your first escrow agreement to get started."}
      </p>
      {!hasAny && (
        <Button asChild className="mt-6">
          <Link href="/dashboard/new">Create your first escrow</Link>
        </Button>
      )}
    </div>
  );
}
