"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface Slide {
  /** Path under /public, e.g. "/assets/hero-1.jpg". Omit to show a placeholder. */
  src?: string;
  /** Required alt text for the image. */
  alt: string;
  /** Optional overlay caption. */
  title?: string;
  subtitle?: string;
}

/**
 * An accessible, animated image carousel.
 *
 * - Auto-advances (crossfade + subtle zoom), pausing on hover/focus and when
 *   the user prefers reduced motion.
 * - Keyboard: arrow keys move between slides; prev/next buttons are ≥44px.
 * - Images lazy-load with required alt text. Until real assets are supplied,
 *   designed placeholder slides render — no fabricated photography.
 */
export function Carousel({
  slides,
  autoPlayMs = 5000,
  ratio = "4 / 3",
  className,
}: {
  slides: Slide[];
  autoPlayMs?: number;
  ratio?: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const count = slides.length;

  React.useEffect(() => {
    setIndex((i) => (i >= count ? 0 : i));
  }, [count]);

  React.useEffect(() => {
    if (reduce || paused || count < 2 || autoPlayMs <= 0) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % count), autoPlayMs);
    return () => window.clearInterval(id);
  }, [reduce, paused, count, autoPlayMs]);

  if (count === 0) return null;
  const go = (i: number) => setIndex(((i % count) + count) % count);
  const active = slides[index]!;

  return (
    <div
      className={cn("relative overflow-hidden rounded-xl border border-border bg-surface-muted", className)}
      style={{ aspectRatio: ratio }}
      role="region"
      aria-roledescription="carousel"
      aria-label="Highlights"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(index + 1);
        if (e.key === "ArrowLeft") go(index - 1);
      }}
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={index}
          className="absolute inset-0"
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0.2 : 0.7, ease: [0.16, 1, 0.3, 1] }}
          aria-roledescription="slide"
          aria-label={`${index + 1} of ${count}`}
        >
          <SlideView slide={active} />
        </motion.div>
      </AnimatePresence>

      {/* Live region for screen readers */}
      <p className="sr-only" aria-live="polite">
        Slide {index + 1} of {count}
        {active.title ? `: ${active.title}` : ""}
      </p>

      {count > 1 && (
        <>
          <CarouselButton side="left" onClick={() => go(index - 1)} label="Previous slide" />
          <CarouselButton side="right" onClick={() => go(index + 1)} label="Next slide" />

          <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                onClick={() => go(i)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  i === index ? "w-6 bg-primary-fg" : "w-2 bg-primary-fg/50 hover:bg-primary-fg/80",
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SlideView({ slide }: { slide: Slide }) {
  const hasImage = Boolean(slide.src);
  return (
    <div className="relative h-full w-full">
      {hasImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={slide.src} alt={slide.alt} loading="lazy" decoding="async" className="h-full w-full object-cover" />
      ) : (
        <div
          role={slide.alt ? "img" : undefined}
          aria-label={slide.alt || undefined}
          className="grid h-full w-full place-items-center bg-gradient-to-br from-primary/20 via-surface-muted to-accent/30"
        >
          <span className="text-xs font-medium uppercase tracking-wide text-fg-muted">
            Image coming soon
          </span>
        </div>
      )}
      {(slide.title || slide.subtitle) && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-fg/70 to-transparent p-5 pb-10 text-surface">
          {slide.title && <p className="font-display text-lg font-semibold">{slide.title}</p>}
          {slide.subtitle && <p className="mt-1 text-sm text-surface/85">{slide.subtitle}</p>}
        </div>
      )}
    </div>
  );
}

function CarouselButton({
  side,
  onClick,
  label,
}: {
  side: "left" | "right";
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "absolute top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-surface/85 text-fg shadow-subtle backdrop-blur transition-colors hover:bg-surface",
        side === "left" ? "left-3" : "right-3",
      )}
    >
      <span aria-hidden className="text-lg leading-none">
        {side === "left" ? "‹" : "›"}
      </span>
    </button>
  );
}
