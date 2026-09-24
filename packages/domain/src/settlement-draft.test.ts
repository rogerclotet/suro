import { describe, expect, it } from "vitest";
import {
  createSettlementDraft,
  selectedSettlementPayments,
  settlementProposalsMatch,
  toggleSettlementPayment,
} from "./expenses";

const a = { from: "a", to: "c", amount: 100 };
const b = { from: "b", to: "c", amount: 400 };

describe("settlement drafts", () => {
  it("keeps B's reviewed payment selected when proposals reorder", () => {
    const draft = toggleSettlementPayment(createSettlementDraft([a, b]), a);
    expect(settlementProposalsMatch(draft.reviewed, [b, a])).toBe(true);
    expect(selectedSettlementPayments(draft)).toEqual([b]);
  });
  it("requires review when amounts or participants change, appear or disappear", () => {
    const draft = createSettlementDraft([a, b]);
    for (const current of [
      [a],
      [a, { ...b, amount: 500 }],
      [a, { ...b, to: "d" }],
      [a, b, { from: "d", to: "c", amount: 20 }],
    ]) {
      expect(settlementProposalsMatch(draft.reviewed, current)).toBe(false);
      expect(selectedSettlementPayments(draft)).toEqual([a, b]);
    }
  });
  it("copies reviewed amounts and starts a fresh selection on review or reopen", () => {
    const payment = { ...a };
    const proposals = [payment];
    const draft = createSettlementDraft(proposals);
    payment.amount = 200;
    expect(draft.reviewed[0]?.amount).toBe(100);
    expect(
      selectedSettlementPayments(toggleSettlementPayment(draft, a)),
    ).toEqual([]);
    expect(
      selectedSettlementPayments(createSettlementDraft(proposals)),
    ).toEqual(proposals);
  });
});
