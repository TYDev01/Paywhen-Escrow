import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell, PageHeader, Prose } from "@/components/marketing/shell";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "For buyers" };

export default function BuyersPage() {
  return (
    <MarketingShell>
      <PageHeader
        title="Pay with confidence"
        subtitle="Your money is held in escrow and only released when you’re satisfied with what you received."
      />
      <Prose>
        <h2>How you’re protected</h2>
        <ul>
          <li>Funds are held — the seller can’t access them until conditions are met.</li>
          <li>You get a defined inspection window to review the item or work.</li>
          <li>You can approve, or raise a dispute with supporting evidence.</li>
          <li>Clear refund paths when the agreed terms aren’t met.</li>
        </ul>
        <h2>What you control</h2>
        <p>
          You and the seller set the amount, delivery requirements, inspection period and
          release conditions together. Nothing progresses until both of you accept.
        </p>
        <div className="pt-4">
          <Button asChild>
            <Link href="/register">Create an account</Link>
          </Button>
        </div>
      </Prose>
    </MarketingShell>
  );
}
