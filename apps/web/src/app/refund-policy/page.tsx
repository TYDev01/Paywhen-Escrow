import type { Metadata } from "next";
import { MarketingShell, PageHeader, Prose, LegalNotice } from "@/components/marketing/shell";

export const metadata: Metadata = { title: "Refund Policy" };

export default function RefundPolicyPage() {
  return (
    <MarketingShell>
      <PageHeader category="Legal" title="Refund Policy" />
      <Prose>
        <LegalNotice />
        <h2>When refunds apply</h2>
        <p>
          A buyer may be refunded when the agreed conditions are not met — for example,
          non-delivery, a delivery that does not match the agreed description, or a dispute
          resolved in the buyer’s favour.
        </p>
        <h2>How refunds are processed</h2>
        <p>
          Refunds are initiated through the configured payment partner and confirmed by a
          verified provider event. A refund is only marked complete once settlement is
          confirmed — never from a browser action alone.
        </p>
        <h2>Partial refunds</h2>
        <p>
          A dispute may result in a partial refund with a corresponding partial payout, split
          according to the resolution decision.
        </p>
        <h2>Timing</h2>
        <p>
          Processing times depend on the payment partner and the buyer’s payment method.
        </p>
      </Prose>
    </MarketingShell>
  );
}
