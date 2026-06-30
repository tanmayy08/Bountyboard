import { useState } from "react";
import type { BountyStatus } from "../types";
import { BountyList } from "../components/BountyList";
import { SolverLeaderboard } from "../components/SolverLeaderboard";
import { useBounties } from "../lib/hooks/useBounties";
import { ToggleGroup, ToggleGroupItem } from "../components/ui/ToggleGroup";
import { useXlmUsdPrice } from "../lib/hooks/useXlmUsdPrice";
import { useContractEvents } from "../lib/hooks/useContractEvents";

const filters: Array<BountyStatus | "All"> = ["All", "Open", "Claimed", "Completed"];

export function BountiesPage() {
  const [filter, setFilter] = useState<BountyStatus | "All">("All");
  const { bounties, error, loading, refresh } = useBounties(filter);
  const eventState = useContractEvents({ onEvent: refresh });
  const xlmUsdPrice = useXlmUsdPrice();

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <section className="min-w-0">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Bounties</h1>
            <p className="mt-1 text-sm text-zinc-400">On-chain work ready for Stellar solvers.</p>
            <p className="mt-2 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-400">
              <span
                className={
                  eventState.listening
                    ? "h-2 w-2 rounded-full bg-emerald-400"
                    : "h-2 w-2 rounded-full bg-amber-300"
                }
              />
              {eventState.listening
                ? `Live contract updates${eventState.latestLedger ? ` · ledger ${eventState.latestLedger}` : ""}`
                : eventState.error ?? "Connecting to contract events"}
            </p>
          </div>
          <ToggleGroup
            type="single"
            value={filter}
            onValueChange={(value) => value && setFilter(value as BountyStatus | "All")}
            className="inline-grid grid-cols-4 rounded-full border border-zinc-800 bg-zinc-950 p-1"
          >
            {filters.map((item) => (
              <ToggleGroupItem
                key={item}
                value={item}
              >
                {item}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <BountyList
          bounties={bounties}
          error={error}
          loading={loading}
          xlmUsdPrice={xlmUsdPrice}
        />
      </section>
      <aside>
        <SolverLeaderboard />
      </aside>
    </div>
  );
}
