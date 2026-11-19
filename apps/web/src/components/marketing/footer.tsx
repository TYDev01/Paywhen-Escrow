import Link from "next/link";
import { Container } from "@/components/ui/container";
import { BrandMark } from "@/components/ui/brand";

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
    <footer className="bg-[#17132d] text-white [&_a]:focus-visible:outline-accent">
      <Container className="grid grid-cols-2 gap-x-6 gap-y-9 py-12 md:grid-cols-[1.55fr_1fr_1fr_1fr] md:py-16">
        <div className="col-span-2 md:col-span-1">
          <Link href="/" className="inline-flex items-center gap-2 text-accent" aria-label="Escrow homepage">
            <BrandMark className="size-9" />
            <span className="font-display text-2xl font-bold tracking-[-0.06em]">Escrow</span>
          </Link>
          <p className="mt-4 text-[0.8125rem] leading-relaxed text-white/75">
            This platform does not hold or safeguard customer funds until the required
            financial partner arrangements and regulatory approvals have been completed
            and verified.
          </p>
        </div>
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h3 className="text-sm font-semibold text-white">{col.title}</h3>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-white/70 transition-colors hover:text-accent"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </Container>
      <div className="border-t border-white/15">
        <Container className="flex flex-col items-center justify-between gap-2 py-5 text-[0.8125rem] leading-relaxed text-white/75 sm:flex-row">
          <p>© {new Date().getFullYear()} Escrow. All rights reserved.</p>
          <p>Legal content is provisional and requires professional review before launch.</p>
        </Container>
      </div>
    </footer>
  );
}
