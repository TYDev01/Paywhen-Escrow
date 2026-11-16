import type { Metadata } from "next";
import { MarketingShell, PageHeader, Prose, LegalNotice } from "@/components/marketing/shell";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <MarketingShell>
      <PageHeader category="Legal" title="Privacy Policy" />
      <Prose>
        <LegalNotice />
        <h2>Information we collect</h2>
        <p>
          Account details you provide, transaction data you create, and identity information
          required for verification. We collect only what is necessary to operate the service.
        </p>
        <h2>How we use information</h2>
        <p>
          To provide escrow services, verify identity, prevent fraud, meet legal obligations,
          and communicate about your transactions.
        </p>
        <h2>Identity documents</h2>
        <p>
          Sensitive identity documents are not stored unnecessarily and are handled through
          the configured verification provider under its data-protection terms.
        </p>
        <h2>Your rights</h2>
        <p>
          Depending on your jurisdiction, you may have rights to access, correct, export, or
          delete your personal data. Account deactivation and data-rights workflows are
          provided.
        </p>
        <h2>Security</h2>
        <p>
          We apply encryption, access controls, and audit logging to protect your data.
        </p>
      </Prose>
    </MarketingShell>
  );
}
