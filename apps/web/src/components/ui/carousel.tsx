"use client";

import { useId, useRef, useState, type ReactNode } from "react";

export function Carousel({
  label,
  stages,
  renderStage,
}: {
  label: string;
  stages: readonly string[];
  renderStage: (index: number) => ReactNode;
}) {
  const id = useId();
  const [active, setActive] = useState(0);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);

  function select(index: number) {
    setActive(index);
    tabs.current[index]?.focus();
  }

  return (
    <div className="deal-carousel" role="region" aria-roledescription="carousel" aria-label={label}>
      <div
        className="deal-tabs"
        role="tablist"
        aria-label="Transaction stages"
        onKeyDown={(event) => {
          const last = stages.length - 1;
          let next: number;
          switch (event.key) {
            case "ArrowLeft": next = active === 0 ? last : active - 1; break;
            case "ArrowRight": next = active === last ? 0 : active + 1; break;
            case "Home": next = 0; break;
            case "End": next = last; break;
            default: return;
          }
          event.preventDefault();
          select(next);
        }}
      >
        {stages.map((title, index) => (
          <button
            key={title}
            ref={(element) => { tabs.current[index] = element; }}
            type="button"
            id={`${id}-tab-${index}`}
            role="tab"
            aria-controls={`${id}-stage-${index}`}
            aria-selected={index === active}
            tabIndex={index === active ? 0 : -1}
            onClick={() => setActive(index)}
          >
            <span className="deal-tab-number" aria-hidden="true">0{index + 1}</span>
            <span>{title}</span>
          </button>
        ))}
      </div>

      {stages.map((title, index) => (
        <div
          key={title}
          role="tabpanel"
          tabIndex={0}
          className="deal-stage"
          id={`${id}-stage-${index}`}
          aria-labelledby={`${id}-tab-${index}`}
          hidden={index !== active}
        >
          {index === active && renderStage(index)}
        </div>
      ))}
    </div>
  );
}
