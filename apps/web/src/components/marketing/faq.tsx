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
    <section id="faq" aria-labelledby="faq-title" className="editorial-faq scroll-mt-4">
      <Container className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:gap-12">
        <h2 id="faq-title" className="editorial-title max-w-[12ch] !text-[clamp(2.5rem,5.7vw,5.5rem)]">
          Frequently asked questions
        </h2>

        <Accordion.Root type="single" collapsible className="divide-y divide-border border-y border-border">
          {faqs.map((item, i) => (
            <Accordion.Item
              key={i}
              value={`item-${i}`}
            >
              <Accordion.Header>
                <Accordion.Trigger className="group flex w-full items-center justify-between gap-4 px-1 py-4 text-left font-semibold hover:text-primary">
                  {item.q}
                  <span
                    aria-hidden
                    className="grid size-9 shrink-0 place-items-center rounded-md border border-border text-xl text-primary transition-transform duration-200 group-data-[state=open]:rotate-45"
                  >
                    +
                  </span>
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="overflow-hidden data-[state=closed]:animate-none">
                <p className="max-w-[65ch] px-1 pb-5 pr-8 text-base leading-relaxed text-fg-muted">{item.a}</p>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </Container>
    </section>
  );
}
