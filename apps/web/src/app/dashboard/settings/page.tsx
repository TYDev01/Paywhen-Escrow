"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ApiError } from "@/lib/api";
import { authedFetch } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkspaceIcon, type WorkspaceIconName } from "@/components/dashboard/workspace-icon";
import { WorkspaceAvatar } from "@/components/dashboard/workspace-avatar";
import {
  useWorkspaceAccount,
  useWorkspaceAccountUpdate,
  type AccountProfile,
} from "@/components/dashboard/workspace-shell";

const DIAL_CODES = [
  { code: "NG", dial: "+234" },
  { code: "US", dial: "+1" },
  { code: "GB", dial: "+44" },
  { code: "GH", dial: "+233" },
  { code: "KE", dial: "+254" },
  { code: "ZA", dial: "+27" },
];

function countryName(code?: string | null) {
  if (!code) return null;
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}
function flagEmoji(code?: string | null) {
  if (!code || code.length !== 2) return "";
  try {
    return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)));
  } catch {
    return "";
  }
}

export default function SettingsPage() {
  const account = useWorkspaceAccount();

  const tier = account?.verification === "VERIFIED" ? "Tier 2" : "Tier 1";
  const country = account?.profile?.country;

  return (
    <div className="workspace-content">
      <header className="workspace-page-heading">
        <div>
          <h1>Account settings</h1>
          <p>Your profile, security and verification details.</p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[14rem_1fr]">
        <SettingsNav />

        <div className="grid gap-5">
          {/* Profile summary */}
          <section className="workspace-panel">
            <div className="workspace-panel-body">
              <h2>Profile</h2>
              <p>The name and photo shown on your account and on payment links.</p>
            </div>
            <div className="flex items-center gap-4 border-t border-border px-5 py-5 sm:px-6">
              <span className="shrink-0 [&_.workspace-avatar]:size-14 [&_.workspace-avatar]:text-base">
                <WorkspaceAvatar name={account?.displayName ?? ""} avatarUrl={account?.avatarUrl} />
              </span>
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-lg font-bold">{account?.displayName ?? "…"}</span>
                  <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-semibold text-fg-muted">{tier}</span>
                </p>
                <p className="truncate text-sm text-fg-muted">{account?.email}</p>
              </div>
              <Button asChild variant="outline" size="sm" className="ml-auto shrink-0">
                <Link href="/dashboard/profile">Edit</Link>
              </Button>
            </div>
          </section>

          {/* Account details */}
          <section className="workspace-panel">
            <div className="workspace-panel-body pb-0">
              <h2>Account details</h2>
            </div>
            <dl className="mt-3">
              <DetailRow icon="mail" label="Email" value={account?.email ?? "—"} />
              <DetailRow icon="phone" label="Phone" value={account?.profile?.phone || "Not provided"} muted={!account?.profile?.phone} />
              <DetailRow icon="card" label="BVN" value="Not provided" muted />
              <DetailRow icon="doc" label="Account type" value="Personal" />
              <DetailRow icon="globe" label="Country"
                value={country ? `${flagEmoji(country)} ${countryName(country)}`.trim() : "Not provided"}
                muted={!country} last />
            </dl>
          </section>

          <PhoneNumberCard profile={account?.profile ?? null} />
        </div>
      </div>
    </div>
  );
}

const NAV_SECTIONS: { heading: string; items: { label: string; icon: WorkspaceIconName; href?: string; active?: boolean; dot?: boolean; soon?: boolean }[] }[] = [
  {
    heading: "Account",
    items: [
      { label: "Profile", icon: "account", active: true },
      { label: "Password & PIN", icon: "lock", href: "/dashboard/profile/password" },
      { label: "Verification", icon: "verify", href: "/dashboard/kyc" },
    ],
  },
  {
    heading: "Security",
    items: [{ label: "Two-factor auth", icon: "verify", dot: true, soon: true }],
  },
  {
    heading: "Support",
    items: [{ label: "Help & support", icon: "support", href: "/dashboard/support" }],
  },
];

function SettingsNav() {
  return (
    <nav aria-label="Settings" className="grid h-max gap-4">
      {NAV_SECTIONS.map((section) => (
        <div key={section.heading} className="grid gap-0.5">
          <p className="px-3 pb-1 text-xs font-bold uppercase tracking-wide text-fg-muted">{section.heading}</p>
          {section.items.map((item) => {
            const inner = (
              <>
                <WorkspaceIcon name={item.icon} className="size-4" />
                <span>{item.label}</span>
                {item.dot && <span aria-hidden className="ml-auto size-1.5 rounded-full bg-warning" />}
                {item.soon && <span className="ml-auto rounded-full bg-surface-muted px-1.5 py-0.5 text-[0.65rem] font-semibold text-fg-muted">Soon</span>}
              </>
            );
            const className = `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-semibold ${
              item.active ? "bg-primary/10 text-primary" : "text-fg hover:bg-surface-muted"
            }`;
            return item.href ? (
              <Link key={item.label} href={item.href} className={className}>{inner}</Link>
            ) : (
              <span key={item.label} className={`${className} ${item.soon ? "cursor-default" : ""}`} aria-current={item.active ? "page" : undefined}>
                {inner}
              </span>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function DetailRow({ icon, label, value, muted, last }: {
  icon: WorkspaceIconName; label: string; value: string; muted?: boolean; last?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-4 px-5 py-3.5 sm:px-6 ${last ? "" : "border-b border-border"}`}>
      <span className="flex items-center gap-2.5 text-sm text-fg-muted">
        <WorkspaceIcon name={icon} className="size-4" />
        {label}
      </span>
      <span className={`text-right text-sm font-semibold ${muted ? "text-fg-muted" : "text-fg"}`}>{value}</span>
    </div>
  );
}

function PhoneNumberCard({ profile }: { profile: AccountProfile | null }) {
  const updateAccount = useWorkspaceAccountUpdate();
  const [dial, setDial] = useState("+234");
  const [number, setNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ error: boolean; message: string } | null>(null);

  async function save(event: FormEvent) {
    event.preventDefault();
    const digits = number.replace(/\s+/g, "");
    if (digits.length < 6) {
      setFeedback({ error: true, message: "Enter a valid phone number." });
      return;
    }
    const phone = `${dial} ${digits}`.trim();
    setSaving(true);
    setFeedback(null);
    try {
      await authedFetch("/me", { method: "PATCH", body: JSON.stringify({ phone }) });
      updateAccount?.({ profile: { ...(profile ?? { legalName: null, phone: null, country: null }), phone } });
      setNumber("");
      setFeedback({ error: false, message: "Phone number updated." });
    } catch (err) {
      setFeedback({ error: true, message: err instanceof ApiError ? err.message : "Couldn’t update your phone number. Try again." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="workspace-panel">
      <div className="workspace-panel-body">
        <div className="flex items-center justify-between gap-3">
          <h2>Phone number</h2>
          <span className="text-xs text-fg-muted">Step 1 of 2</span>
        </div>
        <form onSubmit={save} className="mt-4 grid gap-3">
          <label className="text-sm font-semibold" htmlFor="phone-number">New phone number</label>
          <div className="flex gap-2">
            <select aria-label="Country dialling code" value={dial} onChange={(e) => setDial(e.target.value)}
              className="h-11 rounded-md border border-border bg-surface px-2 text-sm">
              {DIAL_CODES.map((c) => <option key={c.code} value={c.dial}>{flagEmoji(c.code)} {c.dial}</option>)}
            </select>
            <Input id="phone-number" inputMode="tel" placeholder="Enter phone number" value={number}
              onChange={(e) => setNumber(e.target.value)} className="h-11" />
          </div>
          <Button type="submit" size="lg" disabled={saving}>{saving ? "Saving…" : "Save phone number"}</Button>
          {feedback && <p role={feedback.error ? "alert" : "status"} className={feedback.error ? "text-sm text-danger" : "text-sm text-success"}>{feedback.message}</p>}
          <p className="text-xs text-fg-muted">
            This becomes the number you sign in with and the number other people use to pay you.
            (Code-based confirmation isn’t wired up yet — the change is saved directly.)
          </p>
        </form>
      </div>
    </section>
  );
}
