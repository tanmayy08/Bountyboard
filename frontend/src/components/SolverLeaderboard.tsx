import { Trophy } from "lucide-react";
import { useLeaderboard } from "../lib/hooks/useReputation";
import { shortenAddress } from "../lib/stellar";
import { StateBlock } from "./StateBlock";
import { Card, CardHeader } from "./ui/Card";

export function SolverLeaderboard() {
  const { error, leaderboard, loading } = useLeaderboard();

  if (loading) {
    return <StateBlock type="loading" title="Loading leaderboard" message="Reading solver reputation." />;
  }

  if (error) {
    return <StateBlock type="error" title="Leaderboard unavailable" message={error} />;
  }

  if (leaderboard.length === 0) {
    return (
      <StateBlock
        title="No solver scores"
        message="Completed bounties will populate the leaderboard after reputation updates are indexed."
      />
    );
  }

  return (
    <Card as="section">
      <CardHeader className="flex items-center gap-2 text-sm font-medium text-white">
        <Trophy aria-hidden="true" size={17} className="text-emerald-400" />
        <span>Leaderboard</span>
      </CardHeader>
      <div className="divide-y divide-zinc-800">
        {leaderboard.map((entry) => (
          <div key={entry.solver} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-zinc-300">{shortenAddress(entry.solver)}</span>
            <span className="text-sm font-semibold text-white">{entry.score}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
