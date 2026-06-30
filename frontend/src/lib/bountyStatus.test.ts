import { describe, expect, it } from "vitest";
import {
  bountyStatusLabel,
  bountyStatusVariant,
  normalizeBountyStatus,
} from "./bountyStatus";

describe("bounty status helpers", () => {
  it("normalizes Soroban enum arrays", () => {
    expect(normalizeBountyStatus(["Claimed"])).toBe("Claimed");
    expect(normalizeBountyStatus(["Completed"])).toBe("Completed");
  });

  it("normalizes numeric enum indexes", () => {
    expect(normalizeBountyStatus(0)).toBe("Open");
    expect(normalizeBountyStatus("1")).toBe("Claimed");
    expect(normalizeBountyStatus(2n)).toBe("Completed");
  });

  it("returns user-facing labels and variants", () => {
    expect(bountyStatusLabel(["Claimed"])).toBe("Claimed by solver");
    expect(bountyStatusVariant(["Claimed"])).toBe("info");
  });
});
