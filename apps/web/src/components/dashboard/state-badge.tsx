const TONES: Record<string, string> = {
  DRAFT: "bg-surface-muted text-fg-muted",
  PENDING_COUNTERPARTY_ACCEPTANCE: "bg-amber-100 text-amber-900",
  AWAITING_PAYMENT: "bg-amber-100 text-amber-900",
  PAYMENT_PROCESSING: "bg-primary/15 text-primary",
  FUNDED: "bg-primary/15 text-primary",
  IN_PROGRESS: "bg-primary/15 text-primary",
  DELIVERED: "bg-primary/15 text-primary",
  INSPECTION: "bg-primary/15 text-primary",
  DISPUTED: "bg-danger/15 text-danger",
  RELEASE_PENDING: "bg-emerald-100 text-emerald-900",
  RELEASE_PROCESSING: "bg-emerald-100 text-emerald-900",
  COMPLETED: "bg-emerald-100 text-emerald-900",
  REFUND_PENDING: "bg-amber-100 text-amber-900",
  REFUND_PROCESSING: "bg-amber-100 text-amber-900",
  REFUNDED: "bg-fg-muted/15 text-fg-muted",
  CANCELLED: "bg-fg-muted/15 text-fg-muted",
  EXPIRED: "bg-fg-muted/15 text-fg-muted",
};

export function stateLabel(state: string) {
  if (state === "PENDING_COUNTERPARTY_ACCEPTANCE") return "Awaiting acceptance";
  const label = state.replace(/_/g, " ").toLowerCase();
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function StateBadge({ state }: { state: string }) {
  const tone = TONES[state] ?? "bg-surface-muted text-fg-muted";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>
      {stateLabel(state)}
    </span>
  );
}
