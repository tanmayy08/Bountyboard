import { describe, expect, it } from "vitest";
import { formatContractError } from "./contractErrors";

describe("formatContractError", () => {
  it("maps Soroban contract error codes to readable messages", () => {
    expect(
      formatContractError(
        "Simulation failed: HostError: Error(Contract, #5) Event log",
      ),
    ).toBe("This bounty is not open, so it cannot be claimed. (5)");
  });

  it("keeps unknown errors unchanged", () => {
    expect(formatContractError("Freighter rejected the request.")).toBe(
      "Freighter rejected the request.",
    );
  });
});
