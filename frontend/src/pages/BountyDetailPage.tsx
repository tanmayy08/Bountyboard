import { useParams } from "react-router-dom";
import { CheckCircle2, Circle, HandCoins } from "lucide-react";
import { StateBlock } from "../components/StateBlock";
import { useBounty } from "../lib/hooks/useBounties";

const timeline = ["Open", "Claimed", "Completed"];

export function BountyDetailPage() {
  const { id } = useParams();
  const { bounty, error, loading } = useBounty(id);

  if (loading) {
    return <StateBlock type="loading" title="Loading bounty" message="Reading bounty state." />;
  }

  if (error) {
    return <StateBlock type="error" title="Bounty unavailable" message={error} />;
  }

  if (!bounty) {
    return <StateBlock title="Bounty not found" message="No on-chain bounty was found for this id." />;
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <section className="rounded-md border border-zinc-800 bg-zinc-950 p-5">
        <div className="text-sm font-medium text-emerald-400">{bounty.status}</div>
        <h1 className="mt-2 text-2xl font-semibold text-white">{bounty.title}</h1>
        <p className="mt-4 text-sm leading-6 text-zinc-300">{bounty.description}</p>
        <button
          type="button"
          disabled
          className="mt-5 inline-flex h-11 items-center gap-2 rounded-md bg-emerald-500 px-4 text-sm font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <HandCoins aria-hidden="true" size={17} />
          <span>Claim bounty</span>
        </button>
      </section>
      <aside className="rounded-md border border-zinc-800 bg-zinc-950 p-4">
        <h2 className="text-sm font-semibold text-white">Status</h2>
        <div className="mt-4 grid gap-3">
          {timeline.map((item) => {
            const active = item === bounty.status;
            return (
              <div key={item} className="flex items-center gap-2 text-sm">
                {active ? (
                  <CheckCircle2 aria-hidden="true" size={17} className="text-emerald-400" />
                ) : (
                  <Circle aria-hidden="true" size={17} className="text-zinc-600" />
                )}
                <span className={active ? "text-white" : "text-zinc-500"}>{item}</span>
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

