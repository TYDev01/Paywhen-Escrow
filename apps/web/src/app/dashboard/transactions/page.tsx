"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { WorkspaceIcon } from "@/components/dashboard/workspace-icon";
import { TransactionFeedback, TransactionHistory, useTransactions } from "@/components/dashboard/transactions";

export default function TransactionHistoryPage() {
  const { data, retry } = useTransactions();

  return (
    <div className="workspace-content">
      <header className="workspace-page-heading">
        <div>
          <h1>Transaction history</h1>
          <p>Search your escrow agreements and open any transaction to see its activity.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/new"><WorkspaceIcon name="plus" className="size-4" /> Create escrow</Link>
        </Button>
      </header>
      <section className="workspace-panel" aria-label="Transaction records">
        {data.status === "ready" ? (
          <TransactionHistory records={data.records} />
        ) : <TransactionFeedback status={data.status} onRetry={retry} />}
      </section>
    </div>
  );
}
