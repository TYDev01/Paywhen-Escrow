import Link from "next/link";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { Hero } from "@/components/marketing/hero";
import { Faq } from "@/components/marketing/faq";
import { PaymentStatusBanner } from "@/components/marketing/payment-status-banner";
import { Container } from "@/components/ui/container";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <PaymentStatusBanner />
      <main id="main">
        <Hero />

        <section className="home-perspectives" aria-labelledby="perspectives-title">
          <Container>
            <div className="editorial-section-heading">
              <p className="section-label">Buyer and seller protection</p>
              <h2 id="perspectives-title" className="editorial-title">Both sides know<br className="hidden sm:block" /> where they stand.</h2>
            </div>

            <div className="perspectives-grid">
              <article>
                <div className="perspective-media perspective-buyers" />
                <div className="perspective-copy">
                  <h3>For buyers</h3>
                  <p>Check the item or finished work within the agreed inspection window. If there’s a problem, open a dispute and submit evidence.</p>
                  <Link className="editorial-text-link" href="/buyers">Explore buyer protection</Link>
                </div>
              </article>
              <article>
                <div className="perspective-media perspective-sellers" />
                <div className="perspective-copy">
                  <h3>For sellers</h3>
                  <p>See that escrow is funded before you start or ship. Attach proof of delivery and track when payment is due.</p>
                  <Link className="editorial-text-link" href="/sellers">Explore seller protection</Link>
                </div>
              </article>
            </div>
          </Container>
        </section>

        <section className="home-agreement" aria-labelledby="agreement-title">
          <Container className="agreement-grid">
            <div>
              <p className="section-label">The escrow agreement</p>
              <h2 id="agreement-title" className="editorial-title">Set the terms<br />before you pay.</h2>
              <Link className="editorial-button" href="/how-it-works">Read the full process</Link>
            </div>
            <dl>
              <div id="fees">
                <dt>Know the fee up front</dt>
                <dd>Both parties see the fee, the amount the buyer funds, and what the seller receives before accepting.</dd>
                <dd><Link className="editorial-text-link" href="/pricing">See pricing</Link></dd>
              </div>
              <div id="security">
                <dt>Follow the payment record</dt>
                <dd>Escrow verifies provider events and records each balance change in a double-entry ledger.</dd>
                <dd><Link className="editorial-text-link" href="/security">Read about security</Link></dd>
              </div>
            </dl>
          </Container>
        </section>

        <Faq />

        <section className="home-close" aria-labelledby="start-title">
          <Container>
            <div className="home-close-inner">
              <h2 id="start-title" className="editorial-title">What’s your<br className="hidden sm:block" /> next deal?</h2>
              <div>
                <p>Create an account, set the terms, and invite the other party.</p>
                <Link className="editorial-button" href="/register">Create an escrow</Link>
              </div>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
