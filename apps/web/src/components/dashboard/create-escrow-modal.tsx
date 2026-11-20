"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { formatMoney, deserializeMoney, isCurrencyCode } from "@escrow/core";
import { ApiError } from "@/lib/api";
import { authedFetch } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkspaceIcon } from "./workspace-icon";

const CURRENCIES = ["NGN", "USD", "EUR", "GBP", "JPY"] as const;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES = 5;

type Payout = "SINGLE" | "MILESTONES";
interface MilestoneRow {
  key: string;
  title: string;
  amount: string;
}

const money = (amount: string, currency: string) =>
  isCurrencyCode(currency) ? formatMoney(deserializeMoney({ amount, currency })) : `${amount} ${currency}`;

// Decimal string -> integer minor units, so milestone totals use exact math.
function toMinor(decimal: string, currency: string): bigint | null {
  if (!/^\d+(\.\d+)?$/.test(decimal.trim())) return null;
  const zeroDecimal = currency === "JPY";
  const [whole, frac = ""] = decimal.trim().split(".");
  const places = zeroDecimal ? 0 : 2;
  const padded = (frac + "0".repeat(places)).slice(0, places);
  try {
    return BigInt(whole) * BigInt(10 ** places) + (places ? BigInt(padded || "0") : 0n);
  } catch {
    return null;
  }
}

export function CreateEscrowModal({ onClose, onCreated }: { onClose: () => void; onCreated: (paymentId: string) => void }) {
  const [payout, setPayout] = useState<Payout>("SINGLE");
  const [currency, setCurrency] = useState<(typeof CURRENCIES)[number]>("NGN");
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [feePayer, setFeePayer] = useState("");
  const [description, setDescription] = useState("");
  const [deliveryValue, setDeliveryValue] = useState("");
  const [deliveryUnit, setDeliveryUnit] = useState<"days" | "weeks">("days");
  const [milestones, setMilestones] = useState<MilestoneRow[]>([{ key: crypto.randomUUID(), title: "", amount: "" }]);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // Object-URL previews for the chosen images, revoked on change/unmount.
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const milestoneTotalMinor = milestones.reduce((acc, m) => acc + (toMinor(m.amount, currency) ?? 0n), 0n);
  const singleMinor = toMinor(amount, currency);
  const totalMinor = payout === "MILESTONES" ? milestoneTotalMinor : singleMinor;

  function addFiles(selected: FileList | null) {
    if (!selected) return;
    const incoming = Array.from(selected);
    const valid: File[] = [];
    for (const f of incoming) {
      if (!f.type.startsWith("image/")) { setError("Only images can be uploaded (PNG, JPEG, GIF)."); continue; }
      if (f.size > MAX_IMAGE_BYTES) { setError(`"${f.name}" is larger than 5 MB.`); continue; }
      valid.push(f);
    }
    setFiles((current) => [...current, ...valid].slice(0, MAX_IMAGES));
  }

  function updateMilestone(key: string, patch: Partial<MilestoneRow>) {
    setMilestones((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (title.trim().length < 3) return setError("Say what the escrow is for.");
    if (!feePayer) return setError("Choose who pays the fee.");
    if (payout === "SINGLE" && (!singleMinor || singleMinor <= 0n)) return setError("Enter a valid amount.");
    if (payout === "MILESTONES") {
      if (milestones.some((m) => m.title.trim().length < 2 || !toMinor(m.amount, currency) || toMinor(m.amount, currency)! <= 0n)) {
        return setError("Give every milestone a name and a valid amount.");
      }
      if (milestoneTotalMinor <= 0n) return setError("Add at least one milestone amount.");
    }

    // Convert minor units back to a decimal string for the API.
    const places = currency === "JPY" ? 0 : 2;
    const toDecimal = (minor: bigint) =>
      places ? `${minor / 100n}.${(minor % 100n).toString().padStart(2, "0")}` : minor.toString();

    const deliveryDeadline = deliveryValue && Number(deliveryValue) > 0
      ? new Date(Date.now() + Number(deliveryValue) * (deliveryUnit === "weeks" ? 7 : 1) * 86_400_000).toISOString()
      : undefined;

    const payload: Record<string, unknown> = {
      title: title.trim(),
      category: "General",
      creatorRole: "SELLER",
      currency,
      feePayer,
      inspectionPeriodHours: 72,
      payoutType: payout,
      amount: toDecimal(totalMinor ?? 0n),
    };
    if (description.trim()) payload.description = description.trim();
    if (deliveryDeadline) payload.deliveryDeadline = deliveryDeadline;
    if (payout === "MILESTONES") {
      payload.milestones = milestones.map((m) => ({ title: m.title.trim(), amount: toDecimal(toMinor(m.amount, currency)!) }));
    }
    if (files.length) {
      payload.images = files.map((f) => ({ fileName: f.name, contentType: f.type, sizeBytes: f.size }));
    }

    setSubmitting(true);
    try {
      const res = await authedFetch<{ transaction: { reference: string } }>("/agreements", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      onCreated(res.transaction.reference);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn’t create the escrow. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 py-10" role="dialog" aria-modal="true"
      aria-labelledby="create-escrow-title" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-2xl rounded-lg bg-surface p-6 shadow-float sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="create-escrow-title" className="font-display text-xl font-bold">Create an escrow</h2>
            <p className="mt-1 text-sm text-fg-muted">You get a payment ID to send the buyer. Their money is held safely until they confirm they have what they paid for.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-8 shrink-0 place-items-center rounded-md text-fg-muted hover:bg-surface-muted">
            <WorkspaceIcon name="close" className="size-5" />
          </button>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <fieldset>
            <legend className="text-sm font-semibold">How should this be paid out?</legend>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <PayoutCard active={payout === "SINGLE"} onClick={() => setPayout("SINGLE")} icon="plus"
                title="One payment" desc="Released in full when the buyer confirms delivery." />
              <PayoutCard active={payout === "MILESTONES"} onClick={() => setPayout("MILESTONES")} icon="history"
                title="Milestones" desc="Released in stages as each deliverable is confirmed." />
            </div>
          </fieldset>

          <div className="grid grid-cols-[1fr_auto] gap-2">
            <label className="col-span-2 text-sm font-semibold" htmlFor="esc-amount">
              {payout === "MILESTONES" ? "Total (from milestones)" : "Amount"}
            </label>
            {payout === "SINGLE" ? (
              <Input id="esc-amount" inputMode="decimal" placeholder="Enter amount" value={amount}
                onChange={(e) => setAmount(e.target.value)} className="h-11 !rounded" />
            ) : (
              <div className="flex h-11 items-center rounded border border-border bg-surface-muted px-3.5 text-sm font-semibold tabular-nums">
                {money((totalMinor ?? 0n).toString(), currency)}
              </div>
            )}
            <select aria-label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value as typeof currency)}
              className="h-11 rounded border border-border bg-surface px-3 text-sm">
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Labeled label="What is it for?" htmlFor="esc-title">
              <Input id="esc-title" placeholder="E.g. website development" value={title} onChange={(e) => setTitle(e.target.value)} className="h-11 !rounded" />
            </Labeled>

            <Labeled label="Who pays the fee?" htmlFor="esc-fee">
              <select id="esc-fee" value={feePayer} onChange={(e) => setFeePayer(e.target.value)}
                className="h-11 w-full rounded border border-border bg-surface px-3 text-sm">
                <option value="">Select who pays</option>
                <option value="BUYER">Buyer</option>
                <option value="SELLER">Seller</option>
                <option value="SPLIT">Split 50/50</option>
              </select>
            </Labeled>
          </div>

          {payout === "MILESTONES" && (
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Milestones</span>
                <span className="text-xs text-fg-muted">Total {money((milestoneTotalMinor).toString(), currency)}</span>
              </div>
              <div className="mt-2 space-y-2">
                {milestones.map((m, i) => (
                  <div key={m.key} className="flex gap-2">
                    <Input placeholder={`Stage ${i + 1}`} value={m.title} onChange={(e) => updateMilestone(m.key, { title: e.target.value })} className="h-10 !rounded" />
                    <Input inputMode="decimal" placeholder="Amount" value={m.amount} onChange={(e) => updateMilestone(m.key, { amount: e.target.value })} className="h-10 w-28 !rounded" />
                    <button type="button" aria-label="Remove milestone" disabled={milestones.length === 1}
                      onClick={() => setMilestones((rows) => rows.filter((r) => r.key !== m.key))}
                      className="grid size-10 shrink-0 place-items-center rounded border border-border text-fg-muted hover:bg-surface-muted disabled:opacity-40">
                      <WorkspaceIcon name="close" className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" className="mt-2"
                onClick={() => setMilestones((rows) => [...rows, { key: crypto.randomUUID(), title: "", amount: "" }])}>
                <WorkspaceIcon name="plus" className="size-4" /> Add milestone
              </Button>
            </div>
          )}

          <Labeled label="Extra details (optional)" htmlFor="esc-desc">
            <textarea id="esc-desc" rows={3} placeholder="Write a description" value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded border border-border bg-surface p-3 text-sm focus-visible:border-primary focus-visible:outline-none" />
          </Labeled>

          <Labeled label="Delivery timeline" htmlFor="esc-delivery">
            <div className="flex gap-2">
              <Input id="esc-delivery" type="number" min={1} placeholder="Enter number" value={deliveryValue}
                onChange={(e) => setDeliveryValue(e.target.value)} className="h-11 !rounded" />
              <select aria-label="Delivery unit" value={deliveryUnit} onChange={(e) => setDeliveryUnit(e.target.value as "days" | "weeks")}
                className="h-11 w-28 rounded border border-border bg-surface px-3 text-sm">
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
              </select>
            </div>
          </Labeled>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Supporting images</span>
              <span className="text-xs text-fg-muted">{files.length}/{MAX_IMAGES} files</span>
            </div>
            <button type="button" onClick={() => fileInput.current?.click()}
              onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
              className="mt-2 flex w-full flex-col items-center gap-1 rounded-md border border-dashed border-border bg-surface-muted p-5 text-center hover:border-primary">
              <WorkspaceIcon name="arrow" className="size-6 -rotate-90 text-primary" />
              <span className="text-sm font-semibold text-primary">Drop images here or click to upload</span>
              <span className="text-xs text-fg-muted">PNG, JPEG, GIF (max. 5 MB each, up to 5 files)</span>
            </button>
            <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/gif" multiple className="sr-only"
              onChange={(e) => addFiles(e.target.files)} />
            {previews.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {previews.map((src, i) => (
                  <div key={src} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="size-16 rounded border border-border object-cover" />
                    <button type="button" aria-label="Remove image" onClick={() => setFiles((f) => f.filter((_, idx) => idx !== i))}
                      className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-fg text-surface">
                      <WorkspaceIcon name="close" className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-2 text-xs text-fg-muted">Image files aren’t stored yet (no object storage configured) — only their details are recorded.</p>
          </div>

          {error && <p role="alert" className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? "Creating…" : "Create escrow"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PayoutCard({ active, onClick, icon, title, desc }: {
  active: boolean; onClick: () => void; icon: "plus" | "history"; title: string; desc: string;
}) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={`rounded-md border p-3 text-left transition-colors ${active ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
      <WorkspaceIcon name={icon} className="size-5 text-primary" />
      <p className="mt-2 text-sm font-semibold">{title}</p>
      <p className="mt-0.5 text-xs text-fg-muted">{desc}</p>
    </button>
  );
}

function Labeled({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold">{label}</label>
      {children}
    </div>
  );
}
