"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";

const steps = [
  {
    title: "Agree the terms",
    body: "Buyer and seller set the amount, delivery, inspection window and release conditions. Both must accept before anything moves.",
  },
  {
    title: "Buyer funds escrow",
    body: "The buyer pays into escrow through a regulated payment partner. The seller sees the funds are secured — but can’t touch them yet.",
  },
  {
    title: "Seller delivers",
    body: "The seller ships the item or submits the work, with tracking or evidence attached to the transaction.",
  },
  {
    title: "Buyer inspects",
    body: "The buyer reviews within the agreed inspection period and approves — or raises a dispute with evidence.",
  },
  {
    title: "Funds released",
    body: "On approval, escrow releases payment to the seller. A full audit trail records every step.",
  },
];

export function EscrowSteps() {
  const [active, setActive] = React.useState(0);

  return (
    <section id="how" className="py-20">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            A clear path from handshake to payout
          </h2>
          <p className="mt-4 text-fg-muted">
            Every escrow follows the same transparent steps. Tap through to see what
            happens at each stage.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          <ol className="flex flex-col gap-2" aria-label="Escrow process steps">
            {steps.map((step, i) => {
              const isActive = i === active;
              return (
                <li key={step.title}>
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    aria-current={isActive}
                    className={`flex w-full items-start gap-4 rounded-lg border p-4 text-left transition-colors ${
                      isActive
                        ? "border-primary/40 bg-surface shadow-subtle"
                        : "border-transparent hover:bg-surface-muted"
                    }`}
                  >
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold ${
                        isActive ? "bg-primary text-primary-fg" : "bg-surface-muted text-fg-muted"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="font-medium">{step.title}</span>
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="relative rounded-xl border border-border bg-surface p-8 shadow-card">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="inline-flex rounded-full bg-accent/50 px-3 py-1 text-xs font-semibold text-fg">
                Step {active + 1} of {steps.length}
              </div>
              <h3 className="mt-4 font-display text-2xl font-bold">{steps[active]!.title}</h3>
              <p className="mt-3 text-fg-muted">{steps[active]!.body}</p>

              <div className="mt-8 h-2 overflow-hidden rounded-full bg-surface-muted">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${((active + 1) / steps.length) * 100}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </Container>
    </section>
  );
}
