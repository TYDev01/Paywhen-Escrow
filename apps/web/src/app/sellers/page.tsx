import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell, PageHeader, Prose } from "@/components/marketing/shell";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "For sellers" };

export default function SellersPage() {
  return (
    <MarketingShell>
      <PageHeader
        title="Get paid for work you deliver"
        subtitle="See that the buyer’s funds are secured before you ship or start, and know exactly when you’ll be paid."
      />
      <Prose>
        <h2>How you’re protected</h2>
        <ul>
          <li>Confirm the buyer has funded escrow before committing resources.</li>
          <li>Attach delivery evidence and tracking directly to the transaction.</li>
          <li>Release conditions are agreed up front — no moving goalposts.</li>
          <li>Protection against non-payment and unfair reversals.</li>
        </ul>
        <h2>Built for physical goods and services</h2>
        <p>
          Whether you’re shipping a product or delivering freelance work, you submit the
          evidence appropriate to the transaction type and the buyer reviews within the
          agreed window.
        </p>
        <div className="pt-4">
          <Button asChild>
            <Link href="/register">Start selling</Link>
          </Button>
        </div>
      </Prose>
    </MarketingShell>
  );
}
