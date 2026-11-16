import Link from "next/link";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { Hero } from "@/components/marketing/hero";
import { EscrowSteps } from "@/components/marketing/escrow-steps";
import { Faq } from "@/components/marketing/faq";
import { PaymentStatusBanner } from "@/components/marketing/payment-status-banner";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

const buyerPoints = [
  "Your payment is held — the seller can’t take it until you’re satisfied.",
  "A defined inspection window to check what you received.",
  "Open a dispute with evidence if something’s wrong.",
  "Full refund paths when the agreed conditions aren’t met.",
];

const sellerPoints = [
  "See that the buyer’s funds are secured before you ship or start.",
  "Submit delivery evidence and tracking tied to the transaction.",
  "Clear release conditions, so you know exactly when you’re paid.",
  "Protection against non-payment and unfair reversals.",
];

const feeRows: Array<[string, string]> = [
  ["Platform fee", "Shown per transaction before acceptance"],
  ["Who pays", "Buyer, seller, or split — your choice"],
  ["The maths", "Integer minor units, never floating point"],
];

const securityItems: Array<[string, string]> = [
  ["State machine", "Every transition validated on the server."],
  ["Double-entry ledger", "Balances derived from immutable postings."],
  ["Verified events", "Funding follows signed provider webhooks only."],
];

export default function HomePage() {
  return (
    <>
      <PaymentStatusBanner />
      <Navbar />
      <main id="main">
        <Hero />

        {/* Buyer & seller protection — parallel, since both sides matter equally */}
        <section className="py-20">
          <Container>
            <div className="grid gap-6 md:grid-cols-2">
              <ProtectionCard title="Buyer protection" points={buyerPoints} tone="primary" />
              <ProtectionCard title="Seller protection" points={sellerPoints} tone="accent" />
            </div>
          </Container>
        </section>

        <EscrowSteps />

        {/* Transparent fees — asymmetric, statement on the left, the figures on the right */}
        <section id="fees" className="border-y border-border bg-surface py-20">
          <Container className="grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-center">
            <div>
              <h2 className="font-display text-3xl font-bold sm:text-4xl">
                You see every number before you commit.
              </h2>
              <p className="mt-4 max-w-md text-pretty text-fg-muted">
                The exact fee, the amount the buyer funds, and the amount the seller receives
                are all shown before both parties accept. No surprises, no hidden cuts.
              </p>
              <Button asChild variant="outline" className="mt-6">
                <Link href="/pricing">See full pricing</Link>
              </Button>
            </div>
            <dl className="rounded-xl border border-border bg-bg">
              {feeRows.map(([term, desc], i) => (
                <div
                  key={term}
                  className={`flex items-center justify-between gap-6 px-5 py-4 ${
                    i < feeRows.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <dt className="text-fg-muted">{term}</dt>
                  <dd className="text-right font-medium">{desc}</dd>
                </div>
              ))}
            </dl>
          </Container>
        </section>

        {/* Security — a solid, disciplined panel; structure via a leading accent rule */}
        <section id="security" className="py-20">
          <Container>
            <div className="max-w-2xl border-l-2 border-primary pl-6">
              <h2 className="font-display text-3xl font-bold sm:text-4xl">Secure by design</h2>
              <p className="mt-4 text-pretty text-fg-muted">
                Server-enforced authorization, a verified transaction state machine, a
                double-entry ledger, webhook signature verification, and idempotent financial
                operations. Money only moves on verified backend events.
              </p>
            </div>
            <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
              {securityItems.map(([t, d]) => (
                <div key={t} className="bg-surface p-6">
                  <h3 className="font-display font-semibold">{t}</h3>
                  <p className="mt-2 text-sm text-fg-muted">{d}</p>
                </div>
              ))}
            </div>
            <Button asChild className="mt-8">
              <Link href="/security">Read the security overview</Link>
            </Button>
          </Container>
        </section>

        <Faq />

        {/* Closing moment — the one place we go full-bleed indigo */}
        <section className="py-20">
          <Container>
            <div className="overflow-hidden rounded-2xl bg-primary px-8 py-16 text-primary-fg md:px-14">
              <div className="max-w-xl">
                <h2 className="font-display text-3xl font-bold sm:text-4xl">
                  Ready to transact with confidence?
                </h2>
                <p className="mt-4 text-pretty text-primary-fg/85">
                  Create an account, agree the terms, and let escrow hold the trust until the
                  deal is done.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg" variant="accent">
                    <Link href="/register">Get started free</Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-primary-fg/30 bg-transparent text-primary-fg hover:bg-primary-fg/10"
                  >
                    <Link href="/contact">Talk to us</Link>
                  </Button>
                </div>
              </div>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}

function ProtectionCard({
  title,
  points,
  tone,
}: {
  title: string;
  points: string[];
  tone: "primary" | "accent";
}) {
  return (
    <div className="h-full rounded-xl border border-border bg-surface p-7">
      <h3 className="font-display text-xl font-bold">{title}</h3>
      <span
        aria-hidden
        className={`mt-3 block h-1 w-12 rounded-full ${tone === "primary" ? "bg-primary" : "bg-accent"}`}
      />
      <ul className="mt-5 space-y-3">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-3 text-sm text-fg-muted">
            <span
              aria-hidden
              className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-success/15 text-xs text-success"
            >
              ✓
            </span>
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}
