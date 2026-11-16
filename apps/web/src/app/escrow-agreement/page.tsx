import type { Metadata } from "next";
import { MarketingShell, PageHeader, Prose, LegalNotice } from "@/components/marketing/shell";

export const metadata: Metadata = { title: "Escrow Agreement" };

export default function EscrowAgreementPage() {
  return (
    <MarketingShell>
      <PageHeader category="Legal" title="Escrow Agreement" />
      <Prose>
        <LegalNotice />
        <h2>Parties and scope</h2>
        <p>
          Each transaction is governed by an escrow agreement between the buyer and the
          seller, with the platform acting as a neutral facilitator of the agreed terms.
        </p>
        <h2>Agreed terms</h2>
        <p>
          The transaction amount, currency, delivery requirements, inspection period, release
          conditions, refund conditions, and fees are recorded when both parties accept. An
          immutable version of these terms is stored.
        </p>
        <h2>Release of funds</h2>
        <p>
          Funds are released to the seller only when the agreed release conditions are met, or
          per a dispute resolution decision. Funds are never released without verified
          authorization.
        </p>
        <h2>Changes to terms</h2>
        <p>
          A material change to the agreed terms creates a new version and requires renewed
          acceptance from both parties before the transaction proceeds.
        </p>
      </Prose>
    </MarketingShell>
  );
}
