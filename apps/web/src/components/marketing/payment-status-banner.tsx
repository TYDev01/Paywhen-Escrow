"use client";

import * as React from "react";
import { getPaymentCapabilities, type PaymentCapabilities } from "@/lib/api";

type State =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; caps: PaymentCapabilities };

/**
 * Truthful system-status banner. It reports the REAL payment configuration from
 * the backend. When live money movement is not configured, it says so plainly
 * rather than implying funds can be held. No fabricated "funds secured" claims.
 */
export function PaymentStatusBanner() {
  const [state, setState] = React.useState<State>({ kind: "loading" });

  React.useEffect(() => {
    let cancelled = false;
    getPaymentCapabilities()
      .then((caps) => !cancelled && setState({ kind: "ready", caps }))
      .catch(() => !cancelled && setState({ kind: "error" }));
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.kind === "loading") return null;

  if (state.kind === "error") {
    return (
      <Banner tone="warn">
        The platform API is unreachable, so live status can’t be confirmed right now.
      </Banner>
    );
  }

  if (state.caps.liveMoneyMovementEnabled) {
    return (
      <Banner tone="ok">
        Live payments are enabled via {state.caps.provider}. Funds are handled through the
        configured provider.
      </Banner>
    );
  }

  return (
    <Banner tone="warn">
      <strong className="font-semibold">Setup required:</strong>{" "}
      {state.caps.reason ??
        "No payment provider is configured, so funding, payouts and refunds are disabled."}{" "}
      You can still create and agree escrow terms.
    </Banner>
  );
}

function Banner({ tone, children }: { tone: "ok" | "warn"; children: React.ReactNode }) {
  const styles =
    tone === "ok"
      ? "border-success/30 bg-success/10 text-fg"
      : "border-warning/30 bg-warning/10 text-fg";
  return (
    <div role="status" className={`border-b ${styles}`}>
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-5 py-2.5 text-sm sm:px-8">
        <span aria-hidden className="text-base">
          {tone === "ok" ? "✓" : "⚙"}
        </span>
        <p className="text-fg-muted">{children}</p>
      </div>
    </div>
  );
}
