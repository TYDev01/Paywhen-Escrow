/**
 * state-machine.ts — the escrow transaction lifecycle.
 *
 * The set of legal transitions is defined here as data. The API layer is the
 * ONLY place allowed to drive these transitions, always inside a DB transaction
 * with the acting user recorded. A frontend request can never move a
 * transaction to FUNDED / COMPLETED / REFUNDED by itself — those require a
 * verified provider/ledger event, enforced in the service layer.
 */

export const TRANSACTION_STATES = [
  "DRAFT",
  "PENDING_COUNTERPARTY_ACCEPTANCE",
  "AWAITING_PAYMENT",
  "PAYMENT_PROCESSING",
  "FUNDED",
  "IN_PROGRESS",
  "DELIVERED",
  "INSPECTION",
  "DISPUTED",
  "RELEASE_PENDING",
  "RELEASE_PROCESSING",
  "COMPLETED",
  "REFUND_PENDING",
  "REFUND_PROCESSING",
  "REFUNDED",
  "CANCELLED",
  "EXPIRED",
] as const;

export type TransactionState = (typeof TRANSACTION_STATES)[number];

/** States from which no further transition is allowed. */
export const TERMINAL_STATES: ReadonlySet<TransactionState> = new Set([
  "COMPLETED",
  "REFUNDED",
  "CANCELLED",
  "EXPIRED",
]);

/**
 * Transitions that must be triggered by a verified backend event
 * (payment confirmation, payout/refund settlement) rather than a direct
 * user action. The service layer gates these behind provider/ledger proof.
 */
export const SYSTEM_ONLY_TRANSITIONS: ReadonlySet<`${TransactionState}->${TransactionState}`> =
  new Set([
    "PAYMENT_PROCESSING->FUNDED",
    "RELEASE_PROCESSING->COMPLETED",
    "REFUND_PROCESSING->REFUNDED",
  ]);

/** Legal next-states for each state. Anything not listed is rejected. */
export const TRANSITIONS: Readonly<Record<TransactionState, readonly TransactionState[]>> = {
  DRAFT: ["PENDING_COUNTERPARTY_ACCEPTANCE", "CANCELLED", "EXPIRED"],
  PENDING_COUNTERPARTY_ACCEPTANCE: ["AWAITING_PAYMENT", "CANCELLED", "EXPIRED"],
  AWAITING_PAYMENT: ["PAYMENT_PROCESSING", "CANCELLED", "EXPIRED"],
  PAYMENT_PROCESSING: ["FUNDED", "AWAITING_PAYMENT", "CANCELLED"],
  FUNDED: ["IN_PROGRESS", "REFUND_PENDING", "DISPUTED"],
  IN_PROGRESS: ["DELIVERED", "DISPUTED", "REFUND_PENDING"],
  DELIVERED: ["INSPECTION", "DISPUTED"],
  INSPECTION: ["RELEASE_PENDING", "DISPUTED", "REFUND_PENDING"],
  DISPUTED: ["RELEASE_PENDING", "REFUND_PENDING"],
  RELEASE_PENDING: ["RELEASE_PROCESSING"],
  RELEASE_PROCESSING: ["COMPLETED", "RELEASE_PENDING"],
  COMPLETED: [],
  REFUND_PENDING: ["REFUND_PROCESSING"],
  REFUND_PROCESSING: ["REFUNDED", "REFUND_PENDING"],
  REFUNDED: [],
  CANCELLED: [],
  EXPIRED: [],
};

export function isTerminal(state: TransactionState): boolean {
  return TERMINAL_STATES.has(state);
}

export function isSystemOnlyTransition(from: TransactionState, to: TransactionState): boolean {
  return SYSTEM_ONLY_TRANSITIONS.has(`${from}->${to}`);
}

export function canTransition(from: TransactionState, to: TransactionState): boolean {
  return TRANSITIONS[from].includes(to);
}

export class InvalidTransitionError extends Error {
  readonly from: TransactionState;
  readonly to: TransactionState;
  constructor(from: TransactionState, to: TransactionState) {
    super(`Illegal transaction transition: ${from} -> ${to}`);
    this.name = "InvalidTransitionError";
    this.from = from;
    this.to = to;
  }
}

export interface TransitionContext {
  /** True when the transition is driven by a verified backend/provider event. */
  readonly systemTriggered?: boolean;
}

/**
 * Validate a transition, throwing on anything illegal. `systemTriggered` must be
 * true for transitions in SYSTEM_ONLY_TRANSITIONS, blocking a raw client request
 * from, e.g., marking a transaction FUNDED.
 */
export function assertTransition(
  from: TransactionState,
  to: TransactionState,
  ctx: TransitionContext = {},
): TransactionState {
  if (!canTransition(from, to)) {
    throw new InvalidTransitionError(from, to);
  }
  if (isSystemOnlyTransition(from, to) && !ctx.systemTriggered) {
    throw new InvalidTransitionError(from, to);
  }
  return to;
}
