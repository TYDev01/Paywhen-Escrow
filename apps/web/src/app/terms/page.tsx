import type { Metadata } from "next";
import { MarketingShell, PageHeader, Prose, LegalNotice } from "@/components/marketing/shell";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <MarketingShell>
      <PageHeader category="Legal" title="Terms of Service" />
      <Prose>
        <LegalNotice />
        <h2>1. Agreement to terms</h2>
        <p>
          By creating an account or using the platform, you agree to these terms. If you do
          not agree, do not use the service.
        </p>
        <h2>2. The service</h2>
        <p>
          The platform facilitates escrow arrangements between a buyer and a seller. It holds
          an agreed payment through an approved payment partner and releases it when the
          agreed conditions are met.
        </p>
        <h2>3. Eligibility and accounts</h2>
        <p>
          You must provide accurate information and may be required to complete identity
          verification before certain activities. You are responsible for safeguarding your
          account credentials.
        </p>
        <h2>4. Fees</h2>
        <p>
          Applicable fees are displayed before both parties accept a transaction’s terms.
        </p>
        <h2>5. Prohibited use</h2>
        <p>
          You may not use the platform for unlawful transactions, fraud, money laundering, or
          any activity that violates applicable law.
        </p>
        <h2>6. Disputes</h2>
        <p>
          Transaction disputes are handled through the platform’s dispute process. Resolution
          outcomes are applied according to the agreed policy.
        </p>
        <h2>7. Limitation of liability</h2>
        <p>
          To the extent permitted by law, liability is limited as described in the final,
          legally-reviewed version of these terms.
        </p>
      </Prose>
    </MarketingShell>
  );
}
