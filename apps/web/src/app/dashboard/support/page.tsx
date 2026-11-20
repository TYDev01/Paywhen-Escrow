"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ApiError } from "@/lib/api";
import { authedFetch } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkspaceIcon } from "@/components/dashboard/workspace-icon";

const CATEGORIES = [
  ["PAYMENTS", "Payments"],
  ["DISPUTES", "Disputes"],
  ["ACCOUNT", "Account"],
  ["VERIFICATION", "Identity verification"],
  ["OTHER", "Something else"],
] as const;

interface TicketSummary {
  id: string;
  reference: string;
  subject: string;
  category: string;
  status: "OPEN" | "PENDING" | "RESOLVED" | "CLOSED";
  messageCount: number;
  updatedAt: string;
}

const statusTone: Record<TicketSummary["status"], string> = {
  OPEN: "bg-primary/15 text-primary",
  PENDING: "bg-warning/15 text-warning",
  RESOLVED: "bg-success/15 text-success",
  CLOSED: "bg-surface-muted text-fg-muted",
};

const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" });

export default function SupportPage() {
  const [tickets, setTickets] = useState<TicketSummary[]>();
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ error: boolean; message: string } | null>(null);

  useEffect(() => {
    const request = new AbortController();
    authedFetch<TicketSummary[]>("/support/tickets", { signal: request.signal })
      .then((list) => { if (!request.signal.aborted) setTickets(list); })
      .catch(() => { if (!request.signal.aborted) setLoadError(true); });
    return () => request.abort();
  }, [attempt]);

  async function createTicket(event: FormEvent) {
    event.preventDefault();
    if (subject.trim().length < 3 || !category || message.trim().length < 10) {
      setFeedback({ error: true, message: "Add a subject, pick a category, and describe your issue (at least 10 characters)." });
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      await authedFetch("/support/tickets", {
        method: "POST",
        body: JSON.stringify({ subject: subject.trim(), category, message: message.trim() }),
      });
      setSubject("");
      setCategory("");
      setMessage("");
      setFeedback({ error: false, message: "Ticket submitted. We’ll get back to you." });
      setAttempt((v) => v + 1);
    } catch (err) {
      setFeedback({ error: true, message: err instanceof ApiError ? err.message : "Couldn’t submit your ticket. Try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="workspace-content">
      <header className="workspace-page-heading">
        <div>
          <h1>Support tickets</h1>
          <p>Ask our team for help and track your requests.</p>
        </div>
      </header>

      <section className="workspace-panel" aria-labelledby="new-ticket-title">
       <div className="workspace-panel-body">
        <h2 id="new-ticket-title">New ticket</h2>
        <form onSubmit={createTicket} className="workspace-upload-form mt-3" style={{ maxWidth: "100%" }}>
          <label className="workspace-upload-label" htmlFor="ticket-subject">Subject</label>
          <Input id="ticket-subject" value={subject} disabled={submitting} placeholder="Briefly, what do you need help with?"
            onChange={(e) => setSubject(e.target.value)} />
          <label className="workspace-upload-label" htmlFor="ticket-category">Category</label>
          <select id="ticket-category" className="workspace-upload-select" value={category} disabled={submitting}
            onChange={(e) => setCategory(e.target.value)}>
            <option value="">Choose a category</option>
            {CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <label className="workspace-upload-label" htmlFor="ticket-message">Message</label>
          <textarea id="ticket-message" rows={4} value={message} disabled={submitting}
            className="w-full rounded-md border border-border bg-surface p-3 text-sm focus-visible:border-primary focus-visible:outline-none"
            placeholder="Describe your issue in detail." onChange={(e) => setMessage(e.target.value)} />
          <Button type="submit" disabled={submitting}>{submitting ? "Submitting…" : "Submit ticket"}</Button>
          {feedback && <p role={feedback.error ? "alert" : "status"} className={feedback.error ? "text-danger" : "text-success"}>{feedback.message}</p>}
        </form>
       </div>
      </section>

      <section className="workspace-panel" aria-labelledby="ticket-list-title">
       <div className="workspace-panel-body">
        <h2 id="ticket-list-title">Your tickets</h2>
        {loadError ? (
          <div className="workspace-message" role="alert">
            <p>Couldn’t load your tickets.</p>
            <Button variant="outline" onClick={() => { setLoadError(false); setAttempt((v) => v + 1); }}>Try again</Button>
          </div>
        ) : !tickets ? (
          <p className="workspace-message" role="status">Loading tickets…</p>
        ) : tickets.length === 0 ? (
          <div className="workspace-message workspace-empty">
            <span className="workspace-tile-icon" aria-hidden="true"><WorkspaceIcon name="support" /></span>
            <h3>No tickets yet</h3>
            <p>Open a ticket above and our team will help you out.</p>
          </div>
        ) : (
          <ul className="mt-3 grid gap-3">
            {tickets.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-bg p-4">
                <div className="min-w-0">
                  <p className="truncate font-display font-semibold">{t.subject}</p>
                  <p className="text-xs text-fg-muted">{t.reference} · {t.messageCount} message{t.messageCount === 1 ? "" : "s"} · {dateFormat.format(new Date(t.updatedAt))}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusTone[t.status]}`}>
                  {t.status.toLowerCase()}
                </span>
              </li>
            ))}
          </ul>
        )}
       </div>
      </section>
    </div>
  );
}
