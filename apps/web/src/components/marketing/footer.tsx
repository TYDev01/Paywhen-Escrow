import Link from "next/link";
import { Container } from "@/components/ui/container";

const columns = [
  {
    title: "Product",
    links: [
      { href: "/how-it-works", label: "How it works" },
      { href: "/buyers", label: "For buyers" },
      { href: "/sellers", label: "For sellers" },
      { href: "/pricing", label: "Pricing" },
      { href: "/security", label: "Security" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/faq", label: "FAQ" },
      { href: "/contact", label: "Contact" },
      { href: "/dispute-policy", label: "Dispute policy" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms of Service" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/escrow-agreement", label: "Escrow Agreement" },
      { href: "/refund-policy", label: "Refund Policy" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <Container className="grid gap-10 py-14 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-fg">
              E
            </span>
            Escrow
          </Link>
          <p className="mt-4 max-w-xs text-sm text-fg-muted">
            Payment held securely until both sides are satisfied. Buyer and seller
            protection, built in.
          </p>
          <p className="mt-4 text-xs text-fg-muted">
            This platform does not hold or safeguard customer funds until the required
            financial partner arrangements and regulatory approvals have been completed
            and verified.
          </p>
        </div>
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h3 className="text-sm font-semibold text-fg">{col.title}</h3>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-fg-muted transition-colors hover:text-fg"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </Container>
      <div className="border-t border-border">
        <Container className="flex flex-col items-center justify-between gap-2 py-5 text-xs text-fg-muted sm:flex-row">
          <p>© {new Date().getFullYear()} Escrow. All rights reserved.</p>
          <p>Legal content is provisional and requires professional review before launch.</p>
        </Container>
      </div>
    </footer>
  );
}
