import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Brand } from "@/components/ui/brand";
import StaggeredMenu from "@/components/ui/staggered-menu";

const links = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/buyers", label: "For buyers" },
  { href: "/sellers", label: "For sellers" },
  { href: "/pricing", label: "Pricing" },
  { href: "/security", label: "Security" },
];

const menuItems = [
  { href: "/", label: "Home" },
  ...links,
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
  { href: "/login", label: "Log in" },
  { href: "/register", label: "Get started" },
].map(({ href, label }) => ({ link: href, label, ariaLabel: label }));

export function Navbar() {
  return (
    <header className="relative z-40 border-b border-border bg-bg">
      <Container className="flex h-[70px] items-center justify-between gap-3 lg:h-[78px]">
        <Brand />

        <nav aria-label="Primary" className="hidden items-center gap-6 min-[1024px]:flex xl:gap-9">
          {links.map(({ href, label }) => (
            <Link key={href} href={href} className="min-h-11 content-center text-sm font-medium transition-colors hover:text-primary">
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/login" className="hidden text-sm font-semibold hover:text-primary sm:inline-flex">
            Log in
          </Link>
          <Link href="/register" className="editorial-button !hidden !min-h-11 !px-3 min-[420px]:!inline-flex sm:!px-4">
            Get started
          </Link>
          <StaggeredMenu
            items={menuItems}
            colors={["#AFFFCF", "#422FD4"]}
            menuButtonColor="#121020"
            openMenuButtonColor="#422FD4"
            accentColor="#422FD4"
            displaySocials={false}
            displayItemNumbering={false}
          />
        </div>
      </Container>
    </header>
  );
}
