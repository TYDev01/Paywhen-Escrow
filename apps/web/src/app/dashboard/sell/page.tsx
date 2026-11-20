"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkspaceIcon } from "@/components/dashboard/workspace-icon";
import { StateBadge } from "@/components/dashboard/state-badge";
import { CreateEscrowModal } from "@/components/dashboard/create-escrow-modal";
import {
  displayAmount,
  useTransactions,
  TransactionFeedback,
  type TransactionSummary,
} from "@/components/dashboard/transactions";

export default function SellPage() {
  const { data, retry } = useTransactions();
  const [modalOpen, setModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [created, setCreated] = useState<string | null>(null);

  const sellerRecords = data.status === "ready" ? data.records.filter((r) => r.role === "SELLER") : [];
  const search = query.trim().toLowerCase();
  const filtered = sellerRecords.filter(
    (r) => !search || r.reference.toLowerCase().includes(search) || r.title.toLowerCase().includes(search),
  );

  return (
    <div className="workspace-content">
      <header className="workspace-page-heading">
        <div>
          <h1>Sell with escrow</h1>
          <p>Create an escrow and share the payment ID with your buyer. Their money is held safely until they confirm delivery.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <WorkspaceIcon name="plus" className="size-4" /> Create escrow
        </Button>
      </header>

      {created && (
        <div className="workspace-panel" role="status">
          <div className="workspace-panel-body flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-display font-semibold">Escrow created</p>
              <p className="text-sm text-fg-muted">Share this payment ID with your buyer: <span className="font-mono font-semibold text-fg">{created}</span></p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigator.clipboard?.writeText(created)}>Copy payment ID</Button>
          </div>
        </div>
      )}

      <section className="workspace-panel" aria-labelledby="sales-title">
        <div className="workspace-panel-body">
          <h2 id="sales-title">Your escrows</h2>
          <div className="relative mt-3">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted">
              <WorkspaceIcon name="search" className="size-4" />
            </span>
            <label className="sr-only" htmlFor="sell-search">Search your escrows by payment ID</label>
            <Input id="sell-search" type="search" placeholder="Search by payment ID" value={query}
              onChange={(e) => setQuery(e.target.value)} className="pl-9" />
          </div>

          {data.status !== "ready" ? (
            <TransactionFeedback status={data.status} onRetry={retry} />
          ) : filtered.length === 0 ? (
            <div className="workspace-message workspace-empty">
              <span className="workspace-tile-icon" aria-hidden="true"><WorkspaceIcon name="sell" /></span>
              <h3>{sellerRecords.length ? "No matching escrows" : "No escrows yet"}</h3>
              <p>{sellerRecords.length ? "Try another payment ID." : "Create an escrow and share its payment ID with a buyer."}</p>
            </div>
          ) : (
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((r) => <EscrowCard key={r.id} record={r} />)}
            </div>
          )}
        </div>
      </section>

      {modalOpen && (
        <CreateEscrowModal
          onClose={() => setModalOpen(false)}
          onCreated={(paymentId) => { setModalOpen(false); setCreated(paymentId); retry(); }}
        />
      )}
    </div>
  );
}

function EscrowCard({ record }: { record: TransactionSummary }) {
  return (
    <Link href={`/dashboard/transactions/${record.id}`} className="block rounded-xl border border-border bg-bg p-4 transition-colors hover:border-primary">
      <div className="flex items-start justify-between gap-2">
        <p className="font-display font-semibold">{record.title}</p>
        <StateBadge state={record.state} />
      </div>
      <p className="mt-1 font-mono text-xs text-fg-muted">{record.reference}</p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="font-display text-lg font-bold tabular-nums">{displayAmount(record.amountMinor, record.currency)}</span>
        <div className="flex gap-1.5">
          {record.payoutType === "MILESTONES" && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.7rem] font-semibold text-primary">Milestones</span>
          )}
          <span className={`rounded-full px-2 py-0.5 text-[0.7rem] font-semibold ${record.hasBuyer ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
            {record.hasBuyer ? "Buyer joined" : "Awaiting buyer"}
          </span>
        </div>
      </div>
    </Link>
  );
}
