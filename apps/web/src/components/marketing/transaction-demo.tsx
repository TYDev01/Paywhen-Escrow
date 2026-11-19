"use client";

import { useEffect, useState } from "react";
import { Carousel } from "@/components/ui/carousel";
import manifest from "../../../public/assets/manifest.json";

const stages = [
  {
    label: "Fund escrow",
    title: "Payment held.",
    description: "The buyer has funded the deal. The seller can start work knowing the payment is in escrow.",
    status: "Held in escrow",
  },
  {
    label: "Review delivery",
    title: "Delivery in review.",
    description: "The seller has submitted their work. The buyer checks it against the agreement while escrow holds the payment.",
    status: "Awaiting approval",
  },
  {
    label: "Release payment",
    title: "Payment released.",
    description: "The buyer has approved the work. Escrow releases payment to the seller and records the payout.",
    status: "Released to seller",
  },
] as const;

type SlideImage = { src: string; alt: string };

function isSlideImage(value: unknown): value is SlideImage {
  return (
    typeof value === "object" &&
    value !== null &&
    "src" in value &&
    typeof value.src === "string" &&
    value.src.startsWith("/assets/") &&
    "alt" in value &&
    typeof value.alt === "string"
  );
}

export function TransactionDemo() {
  const [images, setImages] = useState<SlideImage[]>(manifest.hero);

  useEffect(() => {
    const request = new AbortController();
    fetch("/assets/manifest.json", { cache: "no-store", signal: request.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { hero?: unknown } | null) => {
        const hero = data?.hero;
        if (!request.signal.aborted && Array.isArray(hero)) {
          setImages(manifest.hero.map((fallback, index) => {
            const image: unknown = hero[index];
            return isSlideImage(image) ? image : fallback;
          }));
        }
      })
      .catch(() => undefined);

    return () => request.abort();
  }, []);

  return (
    <div id="transaction-demo" className="deal-demo">
      <div className="deal-intro">
        <h2>Follow a payment</h2>
        <p>Example transaction <span aria-hidden="true">/</span> Brand identity project</p>
      </div>
      <Carousel
        label="Example escrow transaction"
        stages={stages.map((stage) => stage.label)}
        renderStage={(index) => {
          const stage = stages[index]!;
          const image = images[index]!;
          return (
            <div key={stage.label} className={`deal-frame deal-frame-${index}`}>
              <div className="deal-artwork">
                {/* Runtime images are already optimized and served under /assets/. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.src} alt={image.alt} decoding="async" fetchPriority={index === 0 ? "high" : "auto"} />
              </div>
              <div className="deal-copy">
                <span className="deal-status"><span aria-hidden="true" />{stage.status}</span>
                <h3>{stage.title}</h3>
                <p>{stage.description}</p>
                <div className="deal-amount">
                  <span>Agreed amount</span>
                  <strong>₦85,000</strong>
                </div>
              </div>
            </div>
          );
        }}
      />
    </div>
  );
}
