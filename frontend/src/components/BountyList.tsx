import type { Bounty } from "../types";
import { BountyCard } from "./BountyCard";
import { StateBlock } from "./StateBlock";

interface BountyListProps {
  bounties: Bounty[];
  error: string | null;
  loading: boolean;
}

export function BountyList({ bounties, error, loading }: BountyListProps) {
  if (loading) {
    return <StateBlock type="loading" title="Loading bounties" message="Reading on-chain bounty state." />;
  }

  if (error) {
    return <StateBlock type="error" title="Bounties unavailable" message={error} />;
  }

  if (bounties.length === 0) {
    return (
      <StateBlock
        title="No bounties found"
        message="Once the deployed contract address is configured and bounties exist on-chain, they will appear here."
      />
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {bounties.map((bounty) => (
        <BountyCard key={bounty.id} bounty={bounty} />
      ))}
    </div>
  );
}

