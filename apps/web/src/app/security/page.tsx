import type { Metadata } from "next";
import { MarketingShell, PageHeader, Prose } from "@/components/marketing/shell";

export const metadata: Metadata = { title: "Security" };

export default function SecurityPage() {
  return (
    <MarketingShell>
      <PageHeader
        title="Security and fund integrity"
        subtitle="How the platform protects accounts, transactions, and money movement."
      />
      <Prose>
        <h2>Authorization</h2>
        <p>
          Every protected action is authorized on the server using role-based permissions.
          Frontend role checks are cosmetic only; the API is the source of truth.
        </p>
        <h2>Transaction integrity</h2>
        <p>
          Transactions follow an explicit state machine. Illegal transitions are rejected,
          and sensitive transitions (funding, release, refund) require verified backend
          events. Concurrency is guarded with database transactions and optimistic locking.
        </p>
        <h2>Financial correctness</h2>
        <p>
          All monetary values use integer minor units — never floating point. A double-entry
          ledger records immutable, balanced postings, and account balances are derived from
          those postings rather than stored as editable figures.
        </p>
        <h2>Payments</h2>
        <p>
          Funding is never inferred from a browser redirect. Payments are confirmed through
          signature-verified provider webhooks and reconciliation. Until an approved provider
          and fund-safeguarding arrangement are configured, live money movement is disabled
          and the platform states this plainly.
        </p>
        <h2>Operational safeguards</h2>
        <ul>
          <li>Rate limiting and input validation on the API.</li>
          <li>Idempotency keys on financial requests.</li>
          <li>Append-only audit logging of sensitive actions.</li>
          <li>Secrets kept server-side and out of client code and logs.</li>
        </ul>
      </Prose>
    </MarketingShell>
  );
}
