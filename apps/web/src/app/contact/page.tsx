import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell, PageHeader } from "@/components/marketing/shell";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <MarketingShell>
      <PageHeader
        title="Get in touch"
        subtitle="We’re here to help with questions about escrow, your account, or a transaction."
      />
      <Container className="max-w-2xl py-14">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="font-display text-lg font-bold">Email support</h2>
            <p className="mt-2 text-sm text-fg-muted">
              For general questions and help getting started.
            </p>
            <a
              href="mailto:support@example.com"
              className="mt-4 inline-block font-medium text-primary hover:underline"
            >
              support@example.com
            </a>
          </div>
          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="font-display text-lg font-bold">In-app support</h2>
            <p className="mt-2 text-sm text-fg-muted">
              Signed-in users get transaction-specific support tied to each case.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link href="/login">Log in to continue</Link>
            </Button>
          </div>
        </div>
        <p className="mt-6 text-sm text-fg-muted">
          The support email above is a placeholder until the production support address is
          configured. We don’t publish an office address or phone line we can’t honour.
        </p>
      </Container>
    </MarketingShell>
  );
}
