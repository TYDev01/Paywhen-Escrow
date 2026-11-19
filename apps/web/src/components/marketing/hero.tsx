import Link from "next/link";
import AnimatedContent from "@/components/ui/animated-content";
import { TransactionDemo } from "./transaction-demo";

export function Hero() {
  return (
    <section className="hero-section" aria-labelledby="home-title">
      <AnimatedContent
        className="hero-intro"
        trigger="mount"
        distance={16}
        duration={0.72}
        stagger={0.1}
      >
        <p className="section-label">Escrow for buyers and sellers</p>
        <div className="hero-heading">
          <h1 id="home-title" className="editorial-title">
            <span>Good deals.</span>{" "}
            <span>Clear terms.</span>
          </h1>
          <div className="hero-intro-copy">
            <p>
              Agree on the deal together. Escrow holds the payment until delivery is approved or the agreed release conditions are met.
            </p>
            <Link className="editorial-button" href="/register">Create an escrow</Link>
          </div>
        </div>
      </AnimatedContent>
      <AnimatedContent distance={20} duration={0.75} threshold={0.08}>
        <TransactionDemo />
      </AnimatedContent>
    </section>
  );
}
