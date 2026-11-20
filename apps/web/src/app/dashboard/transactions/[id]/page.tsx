"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { authedFetch, getAccessToken } from "@/lib/auth-store";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { StateBadge, stateLabel } from "@/components/dashboard/state-badge";
import { displayAmount } from "@/components/dashboard/transactions";

interface StateChange {
  id: string;
  fromState: string | null;
  toState: string;
  reason: string | null;
  createdAt: string;
}
interface Milestone {
  id: string;
  order: number;
  title: string;
  amountMinor: string;
  status: "PENDING" | "DELIVERED" | "RELEASED" | "CANCELLED";
}
interface TxDetail {
  id: string;
  reference: string;
  state: string;
  agreement: {
    id: string;
    title: string;
    description: string;
    category: string;
    amountMinor: string;
    currency: string;
    feePayer: string;
    payoutType: "SINGLE" | "MILESTONES";
    milestones: Milestone[];
  };
  stateHistory: StateChange[];
}

const milestoneTone: Record<Milestone["status"], string> = {
  PENDING: "bg-warning/15 text-warning",
  DELIVERED: "bg-primary/15 text-primary",
  RELEASED: "bg-success/15 text-success",
  CANCELLED: "bg-surface-muted text-fg-muted",
};

export default function TransactionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [tx, setTx] = React.useState<TxDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    const data = await authedFetch<TxDetail>(`/transactions/${params.id}`);
    setTx(data);
  }, [params.id]);

  React.useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/login");
      return;
    }
    load()
      .catch(() => setNotice("Could not load this transaction."))
      .finally(() => setLoading(false));
  }, [load, router]);

  const accept = async () => {
    if (!tx) return;
    setBusy(true);
    setNotice(null);
    try {
      await authedFetch(`/agreements/${tx.agreement.id}/accept`, { method: "POST" });
      await load();
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : "Could not accept.");
    } finally {
      setBusy(false);
    }
  };

  const advanceMilestone = async (id: string) => {
    setBusy(true);
    setNotice(null);
    try {
      await authedFetch(`/milestones/${id}/advance`, { method: "POST" });
      await load();
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : "Could not update the milestone.");
    } finally {
      setBusy(false);
    }
  };

  const fund = async () => {
    if (!tx) return;
    setBusy(true);
    setNotice(null);
    try {
      await authedFetch(`/transactions/${tx.id}/fund`, { method: "POST" });
      await load();
    } catch (err) {
      // Honest handling of the configuration-required state.
      if (err instanceof ApiError && err.status === 503) {
        setNotice(
          "Funding is unavailable: no approved payment provider is configured yet. " +
            "No money has been requested or moved.",
        );
      } else {
        setNotice(err instanceof ApiError ? err.message : "Could not start funding.");
      }
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-20">
        <div className="h-8 w-56 animate-pulse rounded bg-surface-muted" />
      </Container>
    );
  }

  if (!tx) {
    return (
      <Container className="py-20">
        <p className="text-fg-muted">{notice ?? "Transaction not found."}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/dashboard/transactions">Back to transaction history</Link>
        </Button>
      </Container>
    );
  }

  const amount = displayAmount(tx.agreement.amountMinor, tx.agreement.currency);

  return (
    <Container className="workspace-content max-w-4xl">
      <Link href="/dashboard/transactions" className="workspace-text-link">
        Back to transaction history
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="break-words font-display text-3xl font-bold tracking-tight sm:text-4xl">{tx.agreement.title}</h1>
          <p className="mt-1 text-sm text-fg-muted">{tx.reference}</p>
        </div>
        <StateBadge state={tx.state} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Info label="Amount" value={amount} mono />
        <Info label="Category" value={tx.agreement.category} />
        <Info label="Fee payer" value={tx.agreement.feePayer.toLowerCase()} />
      </div>

      <div className="mt-6 rounded-lg border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold">Description</h2>
        <p className="mt-2 text-sm text-fg-muted">{tx.agreement.description}</p>
      </div>

      {notice && (
        <div role="status" className="mt-6 rounded-md border border-warning/30 bg-warning/10 px-3 py-2.5 text-sm text-fg-muted">
          {notice}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        {tx.state === "PENDING_COUNTERPARTY_ACCEPTANCE" && (
          <Button onClick={accept} disabled={busy}>
            {busy ? "Working…" : "Accept terms"}
          </Button>
        )}
        {tx.state === "AWAITING_PAYMENT" && (
          <Button onClick={fund} disabled={busy}>
            {busy ? "Working…" : "Fund escrow"}
          </Button>
        )}
      </div>

      {tx.agreement.payoutType === "MILESTONES" && tx.agreement.milestones.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-xl font-bold">Milestones</h2>
          <p className="mt-1 text-sm text-fg-muted">The seller marks each stage delivered; the buyer releases it. (No money moves until a payment provider is configured.)</p>
          <ol className="mt-4 space-y-3">
            {tx.agreement.milestones.map((m, i) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4">
                <div className="min-w-0">
                  <p className="font-semibold">{i + 1}. {m.title}</p>
                  <p className="text-sm tabular-nums text-fg-muted">{displayAmount(m.amountMinor, tx.agreement.currency)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${milestoneTone[m.status]}`}>{m.status.toLowerCase()}</span>
                  {m.status === "PENDING" && (
                    <Button size="sm" variant="outline" onClick={() => advanceMilestone(m.id)} disabled={busy}>Mark delivered</Button>
                  )}
                  {m.status === "DELIVERED" && (
                    <Button size="sm" onClick={() => advanceMilestone(m.id)} disabled={busy}>Release</Button>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      <h2 className="mt-10 font-display text-xl font-bold">Activity history</h2>
      <ol className="mt-4 space-y-4 border-l border-border pl-5">
        {tx.stateHistory.map((h) => (
          <li key={h.id} className="relative">
            <span aria-hidden="true" className="absolute -left-[22px] top-1 h-3 w-3 rounded-full border-2 border-primary bg-bg" />
            <p className="text-sm font-medium">
              {h.fromState ? `${stateLabel(h.fromState)} → ` : ""}
              {stateLabel(h.toState)}
            </p>
            {h.reason && <p className="text-sm text-fg-muted">{h.reason}</p>}
            <p className="mt-0.5 text-xs text-fg-muted">
              {new Date(h.createdAt).toLocaleString()}
            </p>
          </li>
        ))}
      </ol>
    </Container>
  );
}

function Info({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-sm text-fg-muted">{label}</p>
      <p className={`mt-1 font-semibold ${mono ? "tabular-nums" : "capitalize"}`}>{value}</p>
    </div>
  );
}
