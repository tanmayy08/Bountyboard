import { useParams } from "react-router-dom";
import { ReputationBadge } from "../components/ReputationBadge";
import { StateBlock } from "../components/StateBlock";
import { useReputation } from "../lib/hooks/useReputation";
import { shortenAddress } from "../lib/stellar";

export function ProfilePage() {
  const { address } = useParams();
  const { error, loading, reputation } = useReputation(address);

  if (loading) {
    return <StateBlock type="loading" title="Loading profile" message="Reading solver reputation." />;
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <section>
        <div className="mb-4">
          <h1 className="text-2xl font-semibold text-white">Solver profile</h1>
          <p className="mt-1 break-all text-sm text-zinc-400">
            {address ? shortenAddress(address) : "No address selected"}
          </p>
        </div>
        <ReputationBadge reputation={reputation} />
      </section>
      <section>
        {error ? (
          <StateBlock type="error" title="Profile unavailable" message={error} />
        ) : (
          <StateBlock
            title="No completion history"
            message="Solver history will appear after completed bounties are indexed."
          />
        )}
      </section>
    </div>
  );
}

