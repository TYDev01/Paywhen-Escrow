import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell, PageHeader } from "@/components/marketing/shell";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Pricing" };

export default function PricingPage() {
  return (
    <MarketingShell>
      <PageHeader
        title="Simple, transparent fees"
        subtitle="You always see the exact fee and the net amounts before both parties accept the terms."
      />
      <Container className="max-w-3xl py-14">
        <div className="rounded-2xl border border-border bg-surface p-8 shadow-subtle">
          <h2 className="font-display text-2xl font-bold">Per-transaction fee</h2>
          <p className="mt-2 text-fg-muted">
            A platform fee is calculated per escrow and displayed before acceptance. The
            exact rate is configured per jurisdiction and transaction type.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-fg-muted">
            <li className="flex justify-between border-b border-border pb-3">
              <span>Fee model</span>
              <span className="font-semibold text-fg">Percentage + optional fixed</span>
            </li>
            <li className="flex justify-between border-b border-border pb-3">
              <span>Who pays</span>
              <span className="font-semibold text-fg">Buyer, seller, or split</span>
            </li>
            <li className="flex justify-between border-b border-border pb-3">
              <span>Shown before acceptance</span>
              <span className="font-semibold text-fg">Always</span>
            </li>
            <li className="flex justify-between">
              <span>Hidden charges</span>
              <span className="font-semibold text-fg">None</span>
            </li>
          </ul>
          <p className="mt-6 rounded-lg bg-surface-muted p-4 text-sm text-fg-muted">
            Final published rates will be confirmed once the payment partner and operating
            jurisdiction are finalised. No fee is charged on transactions that cannot yet be
            funded.
          </p>
          <div className="mt-8">
            <Button asChild size="lg">
              <Link href="/register">Create your first escrow</Link>
            </Button>
          </div>
        </div>
      </Container>
    </MarketingShell>
  );
}
