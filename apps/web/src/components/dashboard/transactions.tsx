"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatMoney, deserializeMoney, isCurrencyCode, TERMINAL_STATES, type TransactionState } from "@escrow/core";
import { ApiError } from "@/lib/api";
import { authedFetch } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StateBadge, stateLabel } from "./state-badge";
import { WorkspaceIcon } from "./workspace-icon";

export interface TransactionSummary {
  id: string;
  reference: string;
  state: TransactionState;
  title: string;
  amountMinor: string;
  currency: string;
  role: "BUYER" | "SELLER";
  payoutType?: "SINGLE" | "MILESTONES";
  hasBuyer?: boolean;
  updatedAt: string;
}

type TransactionLoad =
  | { status: "loading" }
  | { status: "ready"; records: TransactionSummary[] }
  | { status: "error" };

const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" });
const pageSize = 10;

export function useTransactions() {
  const router = useRouter();
  const [data, setData] = useState<TransactionLoad>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const request = new AbortController();
    authedFetch<TransactionSummary[]>("/transactions", { signal: request.signal })
      .then((records) => {
        if (!request.signal.aborted) setData({ status: "ready", records });
      })
      .catch((error: unknown) => {
        if (request.signal.aborted) return;
        if (error instanceof ApiError && error.status === 401) router.replace("/login");
        else setData({ status: "error" });
      });
    return () => request.abort();
  }, [attempt, router]);

  return {
    data,
    retry: () => { setData({ status: "loading" }); setAttempt((value) => value + 1); },
  };
}

export function transactionCounts(records: TransactionSummary[]) {
  return {
    total: records.length,
    open: records.filter(({ state }) => !TERMINAL_STATES.has(state)).length,
    completed: records.filter(({ state }) => state === "COMPLETED").length,
  };
}

export function displayAmount(amountMinor: string, currency: string) {
  return isCurrencyCode(currency) ? formatMoney(deserializeMoney({ amount: amountMinor, currency })) : `${amountMinor} ${currency} minor units`;
}

export function TransactionTable({ records }: { records: TransactionSummary[] }) {
  return (
    <div className="workspace-table-scroll">
      <table className="workspace-table" role="table" aria-label="Escrow transactions">
        <thead role="rowgroup">
          <tr role="row">
            <th scope="col" role="columnheader">Transaction</th>
            <th scope="col" role="columnheader">Amount</th>
            <th scope="col" role="columnheader">Status</th>
            <th scope="col" role="columnheader">Last updated</th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          {records.map((transaction) => (
            <tr key={transaction.id} role="row">
              <th scope="row" role="rowheader">
                <Link href={`/dashboard/transactions/${transaction.id}`} className="workspace-transaction-link">
                  {transaction.title}
                </Link>
                <span className="workspace-transaction-meta">{transaction.reference} · {transaction.role === "BUYER" ? "Buyer" : "Seller"}</span>
              </th>
              <td data-label="Amount" role="cell" className="whitespace-nowrap font-semibold tabular-nums">{displayAmount(transaction.amountMinor, transaction.currency)}</td>
              <td data-label="Status" role="cell"><StateBadge state={transaction.state} /></td>
              <td data-label="Last updated" role="cell">
                <time dateTime={transaction.updatedAt}>{dateFormat.format(new Date(transaction.updatedAt))}</time>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TransactionFeedback({ status, onRetry }: { status: TransactionLoad["status"]; onRetry: () => void }) {
  if (status === "loading") return <p className="workspace-message" role="status">Loading transactions…</p>;
  if (status !== "error") return null;

  return (
    <div className="workspace-message" role="alert">
      <h3>Couldn’t load transactions</h3>
      <p>Check your connection and try again.</p>
      <Button variant="outline" onClick={onRetry}>Try again</Button>
    </div>
  );
}

export function EmptyTransactions() {
  return (
    <div className="workspace-message workspace-empty">
      <span className="workspace-tile-icon" aria-hidden="true"><WorkspaceIcon name="history" /></span>
      <h3>No transactions yet</h3>
      <p>Your escrow agreements will appear here when you create or join one.</p>
      <Button asChild variant="outline"><Link href="/dashboard/new">Create your first escrow</Link></Button>
    </div>
  );
}

export function TransactionHistory({ records }: { records: TransactionSummary[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(0);
  const statuses = Array.from(new Set(records.map((record) => record.state)))
    .sort((a, b) => stateLabel(a).localeCompare(stateLabel(b)));
  const search = query.trim().toLowerCase();
  const filtered = records.filter((record) =>
    (!status || record.state === status) &&
    (!role || record.role === role) &&
    (!search || record.title.toLowerCase().includes(search) || record.reference.toLowerCase().includes(search)),
  );
  const pageCount = Math.ceil(filtered.length / pageSize);
  const currentPage = Math.min(page, Math.max(pageCount - 1, 0));
  const offset = currentPage * pageSize;

  if (records.length === 0) return <EmptyTransactions />;

  return (
    <>
      <div className="workspace-filters">
        <label className="workspace-search">
          <span className="sr-only">Search transactions by name or reference</span>
          <WorkspaceIcon name="search" />
          <Input type="search" placeholder="Search by name or reference" value={query}
            onChange={(event) => { setQuery(event.target.value); setPage(0); }} />
        </label>
        <select aria-label="Filter by status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(0); }}>
          <option value="">All statuses</option>
          {statuses.map((value) => <option key={value} value={value}>{stateLabel(value)}</option>)}
        </select>
        <select aria-label="Filter by role" value={role} onChange={(event) => { setRole(event.target.value); setPage(0); }}>
          <option value="">All roles</option>
          <option value="BUYER">Buyer</option>
          <option value="SELLER">Seller</option>
        </select>
      </div>
      {filtered.length ? (
        <>
          <TransactionTable records={filtered.slice(offset, offset + pageSize)} />
          <div className="workspace-pagination">
            <p role="status">Showing {offset + 1}–{Math.min(offset + pageSize, filtered.length)} of {filtered.length}</p>
            {pageCount > 1 && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={currentPage + 1 >= pageCount} onClick={() => setPage(currentPage + 1)}>Next</Button>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="workspace-message workspace-empty">
          <h3>No matching transactions</h3>
          <p>Try another search or clear the filters.</p>
          <Button variant="outline" onClick={() => { setQuery(""); setStatus(""); setRole(""); setPage(0); }}>Clear filters</Button>
        </div>
      )}
    </>
  );
}
