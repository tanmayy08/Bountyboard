import type { BountyStatus } from "../types";

const statuses: BountyStatus[] = ["Open", "Claimed", "Completed", "Disputed", "Refunded"];

export function normalizeBountyStatus(status: unknown): BountyStatus {
  if (Array.isArray(status)) {
    return normalizeBountyStatus(status[0]);
  }

  if (typeof status === "number" || typeof status === "bigint") {
    return statuses[Number(status)] ?? "Open";
  }

  if (typeof status === "string" && /^\d+$/.test(status)) {
    return statuses[Number(status)] ?? "Open";
  }

  if (statuses.includes(status as BountyStatus)) {
    return status as BountyStatus;
  }

  return "Open";
}

export function bountyStatusLabel(status: unknown): string {
  const normalized = normalizeBountyStatus(status);

  if (normalized === "Open") return "Open for solvers";
  if (normalized === "Claimed") return "Claimed by solver";
  if (normalized === "Completed") return "Paid and completed";
  if (normalized === "Disputed") return "Reopened after dispute";
  return "Refunded to client";
}

export function bountyStatusVariant(
  status: unknown,
): "default" | "success" | "info" | "warning" {
  const normalized = normalizeBountyStatus(status);

  if (normalized === "Open") return "success";
  if (normalized === "Claimed") return "info";
  if (normalized === "Disputed" || normalized === "Refunded") return "warning";
  return "default";
}
