"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Carousel, type Slide } from "@/components/ui/carousel";

/**
 * Hero: a headline + CTAs beside an animated image carousel.
 *
 * Carousel slides are loaded at runtime from /assets/manifest.json (the `hero`
 * array), so the project owner can drop in real photographs later WITHOUT a
 * rebuild. Until then, designed placeholder slides render — no fabricated
 * photography, no misleading imagery.
 */

// Shown until real hero images are supplied in /assets/manifest.json.
const PLACEHOLDER_SLIDES: Slide[] = [
  { alt: "", title: "Held in escrow", subtitle: "Payment stays safe until the deal is done" },
  { alt: "", title: "Delivered and inspected", subtitle: "A clear window to check what you received" },
  { alt: "", title: "Released with proof", subtitle: "Funds move only on verified conditions" },
];

interface ManifestSlide {
  src: string;
  alt: string;
  title?: string;
  subtitle?: string;
}

export function Hero() {
  const [slides, setSlides] = React.useState<Slide[]>(PLACEHOLDER_SLIDES);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/assets/manifest.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { hero?: ManifestSlide[] } | null) => {
        if (cancelled || !data?.hero?.length) return;
        setSlides(data.hero.map((s) => ({ src: s.src, alt: s.alt, title: s.title, subtitle: s.subtitle })));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="relative overflow-hidden border-b border-border">
      <Container className="grid items-center gap-12 py-16 md:grid-cols-[1fr_1fr] md:py-24">
        <div>
          <h1 className="font-display text-[2.6rem] font-bold leading-[1.02] tracking-tight sm:text-6xl">
            Money that waits
            <br />
            until the deal is done.
          </h1>
          <p className="mt-6 max-w-md text-pretty text-lg text-fg-muted">
            Escrow holds the buyer&apos;s payment and releases it to the seller only when the
            agreed conditions are met. Clear terms, tracked delivery, and a real dispute
            process.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/register">Create your first escrow</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/how-it-works">See how it works</Link>
            </Button>
          </div>
        </div>

        <Carousel slides={slides} ratio="4 / 3" className="shadow-float" />
      </Container>
    </section>
  );
}
