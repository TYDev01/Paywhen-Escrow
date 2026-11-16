"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Media — a responsive image slot that reserves space before load to prevent
 * layout shift (ui-skills rule: set aspect-ratio on media), lazy-loads, crops
 * with object-fit, and REQUIRES accessible alt text.
 *
 * Images are served from /public/assets and referenced by path, so the project
 * owner can drop in new photographs (and update manifest.json) WITHOUT a rebuild
 * (spec §4). Until a real asset exists, a tasteful designed placeholder renders —
 * no fabricated photography.
 */
export function Media({
  src,
  alt,
  ratio = "16 / 9",
  rounded = "lg",
  className,
}: {
  /** Path under /public, e.g. "/assets/hero.jpg". Omit to show the placeholder. */
  src?: string;
  /** Required for accessibility. Describe the image, or "" if purely decorative. */
  alt: string;
  ratio?: string;
  rounded?: "md" | "lg" | "xl";
  className?: string;
}) {
  const [failed, setFailed] = React.useState(false);
  const showPlaceholder = !src || failed;

  return (
    <div
      className={cn(
        "relative overflow-hidden border border-border bg-surface-muted",
        rounded === "md" && "rounded-md",
        rounded === "lg" && "rounded-lg",
        rounded === "xl" && "rounded-xl",
        className,
      )}
      style={{ aspectRatio: ratio }}
    >
      {showPlaceholder ? (
        <div
          aria-hidden={alt === ""}
          role={alt ? "img" : undefined}
          aria-label={alt || undefined}
          className="grid h-full w-full place-items-center bg-gradient-to-br from-primary/15 via-surface-muted to-accent/20"
        >
          <span className="text-xs font-medium uppercase tracking-wide text-fg-muted">
            Image coming soon
          </span>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03] motion-reduce:transition-none motion-reduce:hover:scale-100"
        />
      )}
    </div>
  );
}
