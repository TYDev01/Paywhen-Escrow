"use client";

import * as React from "react";
import { ShieldIcon } from "@/components/ui/brand";
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
    <section id="how" aria-labelledby="how-title" className="scroll-mt-24 py-16 sm:py-24">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-3 text-sm font-semibold text-primary">How escrow works</p>
            <h2 id="how-title" className="font-display text-4xl font-bold leading-[1.04] tracking-[-0.055em] sm:text-5xl">
              From agreement to payout
            </h2>
          </div>
          <p className="max-w-[33ch] leading-relaxed text-fg-muted">
            Follow the five steps from setting the terms to releasing payment.
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
          <ol className="divide-y divide-primary/10 rounded-[27px] border border-primary/15 px-2 py-2 sm:px-3" aria-label="Escrow process steps">
            {steps.map((step, index) => (
              <li key={step.title} className="py-1">
                <button
                  type="button"
                  onClick={() => setActive(index)}
                  aria-current={active === index ? "step" : undefined}
                  aria-controls="escrow-step-detail"
                  className="group flex min-h-12 w-full items-center gap-3 rounded-[16px] px-3 py-2 text-left font-medium transition-colors hover:bg-primary/5 aria-[current=step]:bg-primary aria-[current=step]:text-white"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold tabular-nums text-primary group-aria-[current=step]:bg-accent group-aria-[current=step]:text-fg">
                    {index + 1}
                  </span>
                  {step.title}
                </button>
              </li>
            ))}
          </ol>

          <div id="escrow-step-detail" aria-live="polite" className="flex min-h-[270px] flex-col rounded-[27px] bg-[#eae6ff] p-7 sm:p-9">
            <div className="mb-5 flex items-center justify-between gap-3 text-primary">
              <p className="text-sm font-semibold">Step {active + 1} of {steps.length}</p>
              <ShieldIcon className="size-7" />
            </div>
            <h3 className="font-display text-3xl font-bold tracking-[-0.04em]">{steps[active]!.title}</h3>
            <p className="mt-3 max-w-[48ch] leading-relaxed text-fg-muted">{steps[active]!.body}</p>

            <div className="mt-auto flex gap-1.5 pt-8" aria-hidden="true">
              {steps.map((step, index) => (
                <span key={step.title} className={`h-1.5 flex-1 rounded-full ${index <= active ? "bg-primary" : "bg-primary/15"}`} />
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
