import { Navbar } from "./navbar";
import { Footer } from "./footer";
import { Container } from "@/components/ui/container";

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}

export function PageHeader({
  category,
  title,
  subtitle,
}: {
  /** A real content category (e.g. "Legal"). Omit when it would just restate the title. */
  category?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <section className="border-b border-border bg-surface">
      <Container className="py-16 md:py-20">
        {category && (
          <p className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-fg-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
            {category}
          </p>
        )}
        <h1 className="max-w-3xl text-balance font-display text-4xl font-bold tracking-tight sm:text-5xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-4 max-w-2xl text-pretty text-lg text-fg-muted">{subtitle}</p>
        )}
      </Container>
    </section>
  );
}

export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <Container className="max-w-3xl py-12">
      <div className="space-y-5 text-pretty text-fg-muted [&_h2]:mt-8 [&_h2]:text-balance [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-fg [&_h3]:mt-6 [&_h3]:font-semibold [&_h3]:text-fg [&_li]:ml-5 [&_li]:list-disc [&_p]:leading-relaxed">
        {children}
      </div>
    </Container>
  );
}

export function LegalNotice() {
  return (
    <div className="mt-10 rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-fg-muted">
      <strong className="font-semibold text-fg">Provisional document.</strong> This legal
      content is a working draft and must be reviewed and approved by a qualified legal
      professional for the confirmed operating jurisdiction before the platform launches.
      It does not constitute legal advice.
    </div>
  );
}
