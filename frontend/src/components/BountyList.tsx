import type { Bounty } from "../types";
import { BountyCard } from "./BountyCard";
import { StateBlock } from "./StateBlock";
import { Card, CardContent } from "./ui/Card";

interface BountyListProps {
  bounties: Bounty[];
  error: string | null;
  loading: boolean;
  xlmUsdPrice: number | null;
}

function BountySkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <Card key={index} className="overflow-hidden bg-zinc-950/70">
          <CardContent>
            <div className="h-6 w-20 animate-pulse rounded-full bg-emerald-500/15" />
            <div className="mt-4 h-4 w-4/5 animate-pulse rounded-full bg-zinc-800" />
            <div className="mt-3 h-3 w-full animate-pulse rounded-full bg-zinc-900" />
            <div className="mt-2 h-3 w-2/3 animate-pulse rounded-full bg-zinc-900" />
            <div className="mt-5 h-9 w-28 animate-pulse rounded-full bg-zinc-800" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function BountyList({ bounties, error, loading, xlmUsdPrice }: BountyListProps) {
  if (loading) {
    return <BountySkeletonGrid />;
  }

  if (error) {
    return <StateBlock type="error" title="Bounties unavailable" message={error} />;
  }

  if (bounties.length === 0) {
    return (
      <StateBlock
        title="No bounties yet"
        message="No bounties yet — be the first to post."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
      {bounties.map((bounty) => (
        <BountyCard key={bounty.id} bounty={bounty} xlmUsdPrice={xlmUsdPrice} />
      ))}
    </div>
  );
}
