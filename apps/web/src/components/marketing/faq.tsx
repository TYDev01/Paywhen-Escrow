"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { Container } from "@/components/ui/container";

const faqs = [
  {
    q: "What is escrow and how does it protect me?",
    a: "Escrow is a neutral holding of funds. The buyer pays into escrow, the seller delivers, and the money is only released once the agreed conditions are met. Neither side has to trust the other up front.",
  },
  {
    q: "When is the seller paid?",
    a: "After the buyer approves delivery within the inspection window, or when the agreed release conditions are met. Every release is recorded with an audit trail.",
  },
  {
    q: "What happens if there’s a problem?",
    a: "Either party can open a dispute with evidence. A dispute agent reviews the case and applies the agreed resolution policy — full refund, full payout, or a partial split.",
  },
  {
    q: "What are the fees?",
    a: "A transparent platform fee is shown before both parties accept the terms. You always see the exact amount the buyer funds and the amount the seller receives.",
  },
  {
    q: "Is my money safe?",
    a: "Funds are only ever handled through an approved, regulated payment partner. Until those arrangements are configured and verified, funding is disabled and the platform says so clearly.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="py-20">
      <Container className="max-w-3xl">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-fg-muted">
            Everything you need to know before your first transaction.
          </p>
        </div>

        <Accordion.Root type="single" collapsible className="mt-10 space-y-3">
          {faqs.map((item, i) => (
            <Accordion.Item
              key={i}
              value={`item-${i}`}
              className="overflow-hidden rounded-lg border border-border bg-surface"
            >
              <Accordion.Header>
                <Accordion.Trigger className="group flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium hover:bg-surface-muted">
                  {item.q}
                  <span
                    aria-hidden
                    className="shrink-0 text-fg-muted transition-transform duration-200 group-data-[state=open]:rotate-45"
                  >
                    +
                  </span>
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="overflow-hidden data-[state=closed]:animate-none">
                <p className="px-5 pb-5 text-sm text-fg-muted">{item.a}</p>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </Container>
    </section>
  );
}
