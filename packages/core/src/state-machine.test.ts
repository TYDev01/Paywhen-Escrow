import { describe, it, expect } from "vitest";
import {
  assertTransition,
  canTransition,
  isTerminal,
  InvalidTransitionError,
  TRANSITIONS,
  TRANSACTION_STATES,
} from "./state-machine.js";

describe("state machine", () => {
  it("allows a legal transition", () => {
    expect(assertTransition("DRAFT", "PENDING_COUNTERPARTY_ACCEPTANCE")).toBe(
      "PENDING_COUNTERPARTY_ACCEPTANCE",
    );
  });

  it("rejects an illegal transition", () => {
    expect(() => assertTransition("DRAFT", "COMPLETED")).toThrow(InvalidTransitionError);
  });

  it("blocks system-only transitions from client-triggered calls", () => {
    expect(() => assertTransition("PAYMENT_PROCESSING", "FUNDED")).toThrow(
      InvalidTransitionError,
    );
    expect(
      assertTransition("PAYMENT_PROCESSING", "FUNDED", { systemTriggered: true }),
    ).toBe("FUNDED");
  });

  it("marks terminal states", () => {
    expect(isTerminal("COMPLETED")).toBe(true);
    expect(isTerminal("REFUNDED")).toBe(true);
    expect(isTerminal("FUNDED")).toBe(false);
  });

  it("terminal states have no outgoing transitions", () => {
    for (const state of TRANSACTION_STATES) {
      if (isTerminal(state)) {
        expect(TRANSITIONS[state]).toHaveLength(0);
      }
    }
  });

  it("every transition target is a known state", () => {
    for (const from of TRANSACTION_STATES) {
      for (const to of TRANSITIONS[from]) {
        expect(TRANSACTION_STATES).toContain(to);
        expect(canTransition(from, to)).toBe(true);
      }
    }
  });
});
