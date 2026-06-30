import { useState } from "react";
import type { BountyStatus } from "../types";
import { BountyList } from "../components/BountyList";
import { SolverLeaderboard } from "../components/SolverLeaderboard";
import { useBounties } from "../lib/hooks/useBounties";
import { ToggleGroup, ToggleGroupItem } from "../components/ui/ToggleGroup";

const filters: Array<BountyStatus | "All"> = ["All", "Open", "Claimed", "Completed"];

export function BountiesPage() {
  const [filter, setFilter] = useState<BountyStatus | "All">("All");
  const { bounties, error, loading } = useBounties(filter);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <section className="min-w-0">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Bounties</h1>
            <p className="mt-1 text-sm text-zinc-400">On-chain work ready for Stellar solvers.</p>
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
        <BountyList bounties={bounties} error={error} loading={loading} />
      </section>
      <aside>
        <SolverLeaderboard />
      </aside>
    </div>
  );
}
