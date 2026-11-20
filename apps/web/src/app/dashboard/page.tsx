"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPaymentCapabilities, type PaymentCapabilities } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ShieldIcon } from "@/components/ui/brand";
import { useWorkspaceAccount } from "@/components/dashboard/workspace-shell";
import { WorkspaceIcon, type WorkspaceIconName } from "@/components/dashboard/workspace-icon";
import { stateLabel } from "@/components/dashboard/state-badge";
import {
  EmptyTransactions,
  TransactionFeedback,
  TransactionTable,
  transactionCounts,
  useTransactions,
} from "@/components/dashboard/transactions";

const metrics: { key: "total" | "open" | "completed"; label: string; icon: WorkspaceIconName }[] = [
  { key: "total", label: "Total transactions", icon: "history" },
  { key: "open", label: "Open escrows", icon: "open" },
  { key: "completed", label: "Completed escrows", icon: "check" },
];

export default function DashboardPage() {
  const account = useWorkspaceAccount();
  const { data, retry } = useTransactions();
  const [payments, setPayments] = useState<PaymentCapabilities | null>();
  const counts = data.status === "ready" ? transactionCounts(data.records) : null;

  useEffect(() => {
    let active = true;
    getPaymentCapabilities()
      .then((value) => { if (active) setPayments(value); })
      .catch(() => { if (active) setPayments(null); });
    return () => { active = false; };
  }, []);

  return (
    <div className="workspace-content">
      <section className="workspace-hero" aria-labelledby="workspace-title">
        <div>
          <h1 id="workspace-title">Welcome back{account ? `, ${account.displayName.trim().split(/\s+/)[0]}` : ""}</h1>
          <p>Track your escrow agreements and see where each deal stands.</p>
        </div>
        <Button asChild variant="accent" className="relative shrink-0">
          <Link href="/dashboard/new"><WorkspaceIcon name="plus" className="size-4" /> Create escrow</Link>
        </Button>
      </section>

      <dl className="workspace-metrics" aria-label="Transaction summary">
        {metrics.map(({ key, label, icon }) => (
          <div key={key} className="workspace-panel workspace-metric" data-tone={key}>
            <div>
              <dt>{label}</dt>
              <dd>{counts?.[key] ?? "—"}</dd>
            </div>
            <span className="workspace-tile-icon"><WorkspaceIcon name={icon} /></span>
          </div>
        ))}
      </dl>

      <div className="workspace-overview-grid">
        <section className="workspace-panel min-w-0" aria-labelledby="recent-title">
          <div className="workspace-panel-heading">
            <h2 id="recent-title">Recent transactions</h2>
            <Link className="workspace-text-link" href="/dashboard/transactions">
              View history <WorkspaceIcon name="arrow" className="size-4" />
            </Link>
          </div>
          {data.status === "ready" ? (
            data.records.length ? <TransactionTable records={data.records.slice(0, 5)} /> : <EmptyTransactions />
          ) : <TransactionFeedback status={data.status} onRetry={retry} />}
        </section>

        <div className="workspace-side-panels">
          <section className="workspace-panel workspace-status-panel" aria-labelledby="payment-title">
            <span className="workspace-tile-icon"><ShieldIcon className="size-5" /></span>
            <h2 id="payment-title">Payment status</h2>
            {payments ? (
              <>
                <p className="workspace-status-label" data-enabled={payments.liveMoneyMovementEnabled}>
                  {payments.liveMoneyMovementEnabled ? "Live payments enabled" : "Payments unavailable"}
                </p>
                <p>{payments.liveMoneyMovementEnabled
                  ? `Provider: ${payments.provider}`
                  : "You can agree on escrow terms. Funding, payouts, and refunds are disabled."}</p>
              </>
            ) : (
              <p>{payments === null ? "Payment status couldn’t be confirmed." : "Checking payment status…"}</p>
            )}
          </section>
          {account && (
            <section className="workspace-panel workspace-status-panel" aria-labelledby="account-title">
              <span className="workspace-tile-icon"><WorkspaceIcon name="account" /></span>
              <h2 id="account-title">Account status</h2>
              <dl>
                <div><dt>Identity</dt><dd>{account.verification === "PENDING" ? "Requested" : stateLabel(account.verification)}</dd></div>
                <div><dt>Email</dt><dd>{account.emailVerified ? "Verified" : "Unverified"}</dd></div>
              </dl>
              <Link href="/dashboard/kyc" className="workspace-text-link">View identity verification</Link>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
