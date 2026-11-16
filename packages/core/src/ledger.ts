/**
 * ledger.ts — double-entry bookkeeping rules.
 *
 * A journal entry is a set of postings that MUST balance (debits == credits)
 * per currency. Balances are always derived from postings, never stored as a
 * mutable figure an admin can edit. These pure rules are enforced again at the
 * database layer (the API wraps postings in a transaction and re-checks).
 */
import { CurrencyCode } from "./money.js";

/** Normal balance direction for an account type. */
export type AccountType = "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";

export type PostingDirection = "DEBIT" | "CREDIT";

export interface Posting {
  readonly accountId: string;
  readonly direction: PostingDirection;
  /** Always a positive integer of minor units. */
  readonly amount: bigint;
  readonly currency: CurrencyCode;
}

export interface JournalEntry {
  readonly postings: readonly Posting[];
  readonly reference: string;
  /** Idempotency key — a repeated key must never post twice. */
  readonly idempotencyKey: string;
}

export class LedgerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LedgerError";
  }
}

/**
 * Validate that an entry is well-formed and balanced per currency.
 * Throws LedgerError on any violation. Returns the entry on success.
 */
export function assertBalanced(entry: JournalEntry): JournalEntry {
  if (entry.postings.length < 2) {
    throw new LedgerError("A journal entry needs at least two postings");
  }

  const totals = new Map<CurrencyCode, { debit: bigint; credit: bigint }>();
  for (const p of entry.postings) {
    if (p.amount <= 0n) {
      throw new LedgerError(`Posting amount must be positive, got ${p.amount}`);
    }
    const bucket = totals.get(p.currency) ?? { debit: 0n, credit: 0n };
    if (p.direction === "DEBIT") bucket.debit += p.amount;
    else bucket.credit += p.amount;
    totals.set(p.currency, bucket);
  }

  for (const [currency, { debit, credit }] of totals) {
    if (debit !== credit) {
      throw new LedgerError(
        `Unbalanced entry for ${currency}: debit ${debit} != credit ${credit}`,
      );
    }
  }
  return entry;
}

/** Signed effect of a posting on an account of the given type. */
export function signedEffect(type: AccountType, posting: Posting): bigint {
  const debitPositive = type === "ASSET" || type === "EXPENSE";
  const isDebit = posting.direction === "DEBIT";
  const increases = debitPositive ? isDebit : !isDebit;
  return increases ? posting.amount : -posting.amount;
}
