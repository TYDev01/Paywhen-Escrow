"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Scroll-triggered reveal using IntersectionObserver. Respects
 * prefers-reduced-motion via CSS (.reveal rule in globals.css), and renders
 * content immediately if JS/observer is unavailable (progressive enhancement).
 */
export function ScrollReveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: React.ElementType;
}) {
  const ref = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("is-visible");
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setTimeout(() => el.classList.add("is-visible"), delay);
            observer.unobserve(el);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <Tag ref={ref} className={cn("reveal", className)}>
      {children}
    </Tag>
  );
}
