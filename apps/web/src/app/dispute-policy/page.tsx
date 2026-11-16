import type { Metadata } from "next";
import { MarketingShell, PageHeader, Prose, LegalNotice } from "@/components/marketing/shell";

export const metadata: Metadata = { title: "Dispute Policy" };

export default function DisputePolicyPage() {
  return (
    <MarketingShell>
      <PageHeader category="Legal" title="Dispute Policy" />
      <Prose>
        <LegalNotice />
        <h2>Opening a dispute</h2>
        <p>
          Either party may open a dispute during an active transaction by selecting a reason
          and submitting supporting evidence such as messages, documents, or images.
        </p>
        <h2>Review</h2>
        <p>
          A dispute agent reviews the evidence from both sides and may request additional
          information. Response deadlines apply to keep cases moving.
        </p>
        <h2>Possible outcomes</h2>
        <ul>
          <li>Full buyer refund.</li>
          <li>Full seller payout.</li>
          <li>Partial refund and partial payout.</li>
          <li>Return before refund.</li>
          <li>Escalation for additional review.</li>
        </ul>
        <h2>Appeals</h2>
        <p>
          Where permitted, a party may appeal a decision within the stated window. Every
          decision and appeal is recorded with an audit trail.
        </p>
      </Prose>
    </MarketingShell>
  );
}
