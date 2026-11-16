/**
 * fees.ts — deterministic, integer-only fee computation.
 *
 * A fee schedule is percentage (basis points) + a fixed minor-unit component,
 * optionally clamped to a min/max. The fee payer determines how the escrow
 * amount and the fee combine into what the buyer funds and what the seller nets.
 */
import { Money, add, subtract, applyBasisPoints, money, compare } from "./money.js";

export type FeePayer = "BUYER" | "SELLER" | "SPLIT";

export interface FeeSchedule {
  /** Percentage component in basis points (1 bps = 0.01%). */
  readonly percentageBps: number;
  /** Fixed component in minor units of the transaction currency. */
  readonly fixedMinorUnits: bigint;
  /** Who bears the fee. */
  readonly payer: FeePayer;
  /** Optional floor/ceiling on the computed fee, in minor units. */
  readonly minMinorUnits?: bigint;
  readonly maxMinorUnits?: bigint;
}

export interface FeeBreakdown {
  /** The agreed transaction (escrow) amount. */
  readonly escrowAmount: Money;
  /** Total platform fee charged. */
  readonly platformFee: Money;
  /** Portion of the fee paid by the buyer. */
  readonly buyerFee: Money;
  /** Portion of the fee paid by the seller. */
  readonly sellerFee: Money;
  /** Amount the buyer must fund into escrow (escrow + buyer's fee share). */
  readonly buyerTotal: Money;
  /** Amount the seller receives on release (escrow - seller's fee share). */
  readonly sellerPayout: Money;
}

function clampFee(fee: Money, schedule: FeeSchedule): Money {
  let result = fee;
  if (schedule.minMinorUnits !== undefined) {
    const min = money(schedule.minMinorUnits, fee.currency);
    if (compare(result, min) < 0) result = min;
  }
  if (schedule.maxMinorUnits !== undefined) {
    const max = money(schedule.maxMinorUnits, fee.currency);
    if (compare(result, max) > 0) result = max;
  }
  return result;
}

/** Compute the full fee breakdown for an escrow amount. */
export function computeFees(escrowAmount: Money, schedule: FeeSchedule): FeeBreakdown {
  const percentagePart = applyBasisPoints(escrowAmount, schedule.percentageBps);
  const fixedPart = money(schedule.fixedMinorUnits, escrowAmount.currency);
  const rawFee = add(percentagePart, fixedPart);
  const platformFee = clampFee(rawFee, schedule);

  let buyerFee: Money;
  let sellerFee: Money;
  switch (schedule.payer) {
    case "BUYER":
      buyerFee = platformFee;
      sellerFee = money(0n, escrowAmount.currency);
      break;
    case "SELLER":
      buyerFee = money(0n, escrowAmount.currency);
      sellerFee = platformFee;
      break;
    case "SPLIT": {
      // Buyer takes the ceiling half so the two shares always sum to the fee.
      const half = applyBasisPoints(platformFee, 5000); // 50%, half-up
      buyerFee = half;
      sellerFee = subtract(platformFee, half);
      break;
    }
  }

  const buyerTotal = add(escrowAmount, buyerFee);
  const sellerPayout = subtract(escrowAmount, sellerFee);

  return { escrowAmount, platformFee, buyerFee, sellerFee, buyerTotal, sellerPayout };
}
