"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ApiError } from "@/lib/api";
import { authedFetch } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { WorkspaceIcon } from "@/components/dashboard/workspace-icon";
import { displayAmount, useTransactions } from "@/components/dashboard/transactions";

interface DisputeSummary {
  id: string;
  status: "OPEN" | "IN_REVIEW" | "RESOLVED" | "APPEALED" | "CLOSED";
  reason: string;
  transactionId: string;
  transactionReference: string;
  title: string;
  amountMinor: string;
  currency: string;
  role: "BUYER" | "SELLER";
  openedByMe: boolean;
  messageCount: number;
  createdAt: string;
}

const statusTone: Record<DisputeSummary["status"], string> = {
  OPEN: "bg-warning/15 text-warning",
  IN_REVIEW: "bg-primary/15 text-primary",
  APPEALED: "bg-warning/15 text-warning",
  RESOLVED: "bg-success/15 text-success",
  CLOSED: "bg-surface-muted text-fg-muted",
};

const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" });

export default function DisputesPage() {
  const { data: txData } = useTransactions();
  const [disputes, setDisputes] = useState<DisputeSummary[]>();
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [transactionId, setTransactionId] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ error: boolean; message: string } | null>(null);

  useEffect(() => {
    const request = new AbortController();
    authedFetch<DisputeSummary[]>("/disputes", { signal: request.signal })
      .then((list) => { if (!request.signal.aborted) setDisputes(list); })
      .catch(() => { if (!request.signal.aborted) setLoadError(true); });
    return () => request.abort();
  }, [attempt]);

  async function openDispute(event: FormEvent) {
    event.preventDefault();
    if (!transactionId || reason.trim().length < 10) {
      setFeedback({ error: true, message: "Pick a transaction and describe the problem (at least 10 characters)." });
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      await authedFetch("/disputes", { method: "POST", body: JSON.stringify({ transactionId, reason: reason.trim() }) });
      setTransactionId("");
      setReason("");
      setFeedback({ error: false, message: "Dispute opened." });
      setAttempt((v) => v + 1);
    } catch (err) {
      setFeedback({ error: true, message: err instanceof ApiError ? err.message : "Couldn’t open the dispute. Try again." });
    } finally {
      setSubmitting(false);
    }
  }

  const openableTx = txData.status === "ready" ? txData.records : [];

  return (
    <div className="workspace-content">
      <header className="workspace-page-heading">
        <div>
          <h1>Disputes</h1>
          <p>Raise and follow disputes on your escrow transactions.</p>
        </div>
      </header>

      <section className="workspace-panel" aria-labelledby="open-dispute-title">
       <div className="workspace-panel-body">
        <h2 id="open-dispute-title">Open a dispute</h2>
        <form onSubmit={openDispute} className="workspace-upload-form mt-3" style={{ maxWidth: "100%" }}>
          <label className="workspace-upload-label" htmlFor="dispute-tx">Transaction</label>
          <select id="dispute-tx" className="workspace-upload-select" value={transactionId} disabled={submitting}
            onChange={(e) => setTransactionId(e.target.value)}>
            <option value="">Choose a transaction</option>
            {openableTx.map((t) => (
              <option key={t.id} value={t.id}>{t.title} · {t.reference} · {displayAmount(t.amountMinor, t.currency)}</option>
            ))}
          </select>
          <label className="workspace-upload-label" htmlFor="dispute-reason">What went wrong?</label>
          <textarea id="dispute-reason" rows={3} value={reason} disabled={submitting}
            className="w-full rounded-md border border-border bg-surface p-3 text-sm focus-visible:border-primary focus-visible:outline-none"
            placeholder="Describe the issue and what resolution you want." onChange={(e) => setReason(e.target.value)} />
          <Button type="submit" disabled={submitting}>{submitting ? "Opening…" : "Open dispute"}</Button>
          {feedback && <p role={feedback.error ? "alert" : "status"} className={feedback.error ? "text-danger" : "text-success"}>{feedback.message}</p>}
        </form>
       </div>
      </section>

      <section className="workspace-panel" aria-labelledby="dispute-list-title">
       <div className="workspace-panel-body">
        <h2 id="dispute-list-title">Your disputes</h2>
        {loadError ? (
          <div className="workspace-message" role="alert">
            <p>Couldn’t load your disputes.</p>
            <Button variant="outline" onClick={() => { setLoadError(false); setAttempt((v) => v + 1); }}>Try again</Button>
          </div>
        ) : !disputes ? (
          <p className="workspace-message" role="status">Loading disputes…</p>
        ) : disputes.length === 0 ? (
          <div className="workspace-message workspace-empty">
            <span className="workspace-tile-icon" aria-hidden="true"><WorkspaceIcon name="dispute" /></span>
            <h3>No disputes</h3>
            <p>If something goes wrong with a transaction, open a dispute above.</p>
          </div>
        ) : (
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {disputes.map((d) => (
              <Link key={d.id} href={`/dashboard/transactions/${d.transactionId}`}
                className="block rounded-xl border border-border bg-bg p-4 transition-colors hover:border-primary">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-display font-semibold">{d.title}</p>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusTone[d.status]}`}>
                    {d.status.replace("_", " ").toLowerCase()}
                  </span>
                </div>
                <p className="mt-1 text-xs text-fg-muted">{d.transactionReference} · opened by {d.openedByMe ? "you" : "the other party"}</p>
                <p className="mt-2 line-clamp-2 text-sm text-fg-muted">{d.reason}</p>
                <p className="mt-3 text-xs text-fg-muted">{d.messageCount} message{d.messageCount === 1 ? "" : "s"} · {dateFormat.format(new Date(d.createdAt))}</p>
              </Link>
            ))}
          </div>
        )}
       </div>
      </section>
    </div>
  );
}
