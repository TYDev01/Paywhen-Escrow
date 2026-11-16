const TONES: Record<string, string> = {
  DRAFT: "bg-surface-muted text-fg-muted",
  PENDING_COUNTERPARTY_ACCEPTANCE: "bg-warning/15 text-warning",
  AWAITING_PAYMENT: "bg-warning/15 text-warning",
  PAYMENT_PROCESSING: "bg-primary/15 text-primary",
  FUNDED: "bg-primary/15 text-primary",
  IN_PROGRESS: "bg-primary/15 text-primary",
  DELIVERED: "bg-primary/15 text-primary",
  INSPECTION: "bg-primary/15 text-primary",
  DISPUTED: "bg-danger/15 text-danger",
  RELEASE_PENDING: "bg-success/15 text-success",
  RELEASE_PROCESSING: "bg-success/15 text-success",
  COMPLETED: "bg-success/15 text-success",
  REFUND_PENDING: "bg-warning/15 text-warning",
  REFUND_PROCESSING: "bg-warning/15 text-warning",
  REFUNDED: "bg-fg-muted/15 text-fg-muted",
  CANCELLED: "bg-fg-muted/15 text-fg-muted",
  EXPIRED: "bg-fg-muted/15 text-fg-muted",
};

export function StateBadge({ state }: { state: string }) {
  const tone = TONES[state] ?? "bg-surface-muted text-fg-muted";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>
      {state.replace(/_/g, " ").toLowerCase()}
    </span>
  );
}
