"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { TransactionState } from "@escrow/core";
import { ApiError } from "@/lib/api";
import { authedFetch } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkspaceIcon } from "@/components/dashboard/workspace-icon";
import { StateBadge } from "@/components/dashboard/state-badge";
import {
  displayAmount,
  useTransactions,
  TransactionFeedback,
  type TransactionSummary,
} from "@/components/dashboard/transactions";

interface LookupResult {
  id: string;
  reference: string;
  state: TransactionState;
  title: string;
  description: string;
  amountMinor: string;
  currency: string;
  role: "BUYER" | "SELLER";
  payoutType?: "SINGLE" | "MILESTONES";
  claimable?: boolean;
}

export default function BuyPage() {
  const router = useRouter();
  const { data, retry } = useTransactions();
  const [paymentId, setPaymentId] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  async function claim() {
    if (!result) return;
    setClaiming(true);
    setError(null);
    try {
      const res = await authedFetch<{ transactionId: string }>(`/agreements/claim/${encodeURIComponent(result.reference)}`, { method: "POST" });
      router.push(`/dashboard/transactions/${res.transactionId}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn’t join this escrow. Try again.");
      setClaiming(false);
    }
  }

  async function verify(event: FormEvent) {
    event.preventDefault();
    const reference = paymentId.trim();
    if (!reference) return;
    setVerifying(true);
    setError(null);
    setResult(null);
    try {
      const found = await authedFetch<LookupResult>(`/transactions/by-reference/${encodeURIComponent(reference)}`);
      setResult(found);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn’t verify that payment ID. Try again.");
    } finally {
      setVerifying(false);
    }
  }

  const buyerRecords = data.status === "ready" ? data.records.filter((r) => r.role === "BUYER") : [];
  const search = query.trim().toLowerCase();
  const filtered = buyerRecords.filter(
    (r) => !search || r.reference.toLowerCase().includes(search) || r.title.toLowerCase().includes(search),
  );

  return (
    <div className="workspace-content">
      <header className="workspace-page-heading">
        <div>
          <h1>Buy</h1>
          <p>Pay sellers through escrow and track the purchases you’re funding.</p>
        </div>
      </header>

      <section className="workspace-panel" aria-labelledby="pay-title">
       <div className="workspace-panel-body">
        <h2 id="pay-title">Pay with escrow</h2>
        <p>
          Enter the payment ID your seller sent you. Your money is held safely until you confirm
          the item arrived as described.
        </p>

        <form onSubmit={verify} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start">
          <label className="sr-only" htmlFor="payment-id">Payment ID</label>
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted">
              <WorkspaceIcon name="search" className="size-4" />
            </span>
            <Input
              id="payment-id"
              value={paymentId}
              onChange={(e) => setPaymentId(e.target.value)}
              placeholder="e.g. TX-8AB12C9D"
              className="h-12 pl-9"
              autoComplete="off"
            />
          </div>
          <Button type="submit" size="lg" disabled={verifying || !paymentId.trim()}>
            {verifying ? "Verifying…" : "Verify payment ID"}
          </Button>
        </form>

        {error && (
          <p role="alert" className="mt-3 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        {result && (
          <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display font-semibold">{result.title}</p>
                <p className="text-xs text-fg-muted">{result.reference} · You are the {result.role === "BUYER" ? "buyer" : "seller"}</p>
              </div>
              <StateBadge state={result.state} />
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-fg-muted">{result.description}</p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="font-display text-lg font-bold tabular-nums">{displayAmount(result.amountMinor, result.currency)}</span>
              {result.claimable ? (
                <Button size="sm" onClick={claim} disabled={claiming}>
                  {claiming ? "Joining…" : "Pay with escrow"}
                </Button>
              ) : (
                <Button asChild size="sm">
                  <Link href={`/dashboard/transactions/${result.id}`}>Open transaction</Link>
                </Button>
              )}
            </div>
            {result.payoutType === "MILESTONES" && (
              <p className="mt-2 text-xs text-fg-muted">This escrow is paid in milestones.</p>
            )}
          </div>
        )}
       </div>
      </section>

      <section className="workspace-panel" aria-labelledby="buys-title">
       <div className="workspace-panel-body">
        <h2 id="buys-title">Your purchases</h2>
        <div className="relative mt-3">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted">
            <WorkspaceIcon name="search" className="size-4" />
          </span>
          <label className="sr-only" htmlFor="buy-search">Search your purchases by payment ID</label>
          <Input id="buy-search" type="search" placeholder="Search by payment ID" value={query}
            onChange={(e) => setQuery(e.target.value)} className="pl-9" />
        </div>

        {data.status !== "ready" ? (
          <TransactionFeedback status={data.status} onRetry={retry} />
        ) : filtered.length === 0 ? (
          <div className="workspace-message workspace-empty">
            <span className="workspace-tile-icon" aria-hidden="true"><WorkspaceIcon name="buy" /></span>
            <h3>{buyerRecords.length ? "No matching purchases" : "No purchases yet"}</h3>
            <p>{buyerRecords.length ? "Try another payment ID." : "Verify a payment ID above to fund your first escrow purchase."}</p>
          </div>
        ) : (
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {filtered.map((r) => <PurchaseCard key={r.id} record={r} />)}
          </div>
        )}
       </div>
      </section>
    </div>
  );
}

function PurchaseCard({ record }: { record: TransactionSummary }) {
  return (
    <Link href={`/dashboard/transactions/${record.id}`} className="block rounded-xl border border-border bg-bg p-4 transition-colors hover:border-primary">
      <div className="flex items-start justify-between gap-3">
        <p className="font-display font-semibold">{record.title}</p>
        <StateBadge state={record.state} />
      </div>
      <p className="mt-1 text-xs text-fg-muted">{record.reference}</p>
      <p className="mt-3 font-display text-lg font-bold tabular-nums">{displayAmount(record.amountMinor, record.currency)}</p>
    </Link>
  );
}
