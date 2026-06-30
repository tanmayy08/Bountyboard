import { useState } from "react";
import type { BountyStatus } from "../types";
import { BountyList } from "../components/BountyList";
import { SolverLeaderboard } from "../components/SolverLeaderboard";
import { useBounties } from "../lib/hooks/useBounties";

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
          <div className="inline-grid grid-cols-4 rounded-md border border-zinc-800 bg-zinc-950 p-1">
            {filters.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={[
                  "h-9 rounded px-3 text-sm transition",
                  filter === item
                    ? "bg-emerald-500 text-zinc-950"
                    : "text-zinc-400 hover:text-white",
                ].join(" ")}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <BountyList bounties={bounties} error={error} loading={loading} />
      </section>
      <aside>
        <SolverLeaderboard />
      </aside>
    </div>
  );
}

