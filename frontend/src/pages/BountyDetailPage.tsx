import { useParams } from "react-router-dom";
import { CheckCircle2, Circle, HandCoins, RefreshCcw, ShieldCheck, XCircle } from "lucide-react";
import { useState } from "react";
import { StateBlock } from "../components/StateBlock";
import {
  assertWalletNetwork,
  claimBounty,
  completeBounty,
  disputeBounty,
  refundBounty,
} from "../lib/contracts";
import { useBounty } from "../lib/hooks/useBounties";
import { useFreighter } from "../lib/hooks/useFreighter";

const timeline = ["Open", "Claimed", "Completed"];

export function BountyDetailPage() {
  const { id } = useParams();
  const { bounty, error, loading, refresh } = useBounty(id);
  const { address, connect, network, sign } = useFreighter();
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rating, setRating] = useState(5);

  if (loading) {
    return <StateBlock type="loading" title="Loading bounty" message="Reading bounty state." />;
  }

  if (error) {
    return <StateBlock type="error" title="Bounty unavailable" message={error} />;
  }

  if (!bounty) {
    return <StateBlock title="Bounty not found" message="No on-chain bounty was found for this id." />;
  }

  const connectedAddress = address?.toLowerCase();
  const isClient = connectedAddress === bounty.client.toLowerCase();
  const isOpen = bounty.status === "Open";
  const isClaimed = bounty.status === "Claimed";
  const deadlinePassed = bounty.deadline > 0 && Date.now() / 1000 > bounty.deadline;

  const runAction = async (
    label: string,
    action: (actor: string) => Promise<{ hash: string }>,
  ) => {
    setActionLoading(true);
    setActionMessage(`${label}: preparing transaction.`);
    try {
      const actor = address ?? (await connect());
      assertWalletNetwork(network);
      setActionMessage(`${label}: waiting for wallet signature.`);
      const result = await action(actor);
      setActionMessage(`${label} confirmed. Transaction: ${result.hash}`);
      refresh();
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : `${label} failed.`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <section className="rounded-md border border-zinc-800 bg-zinc-950 p-5">
        <div className="text-sm font-medium text-emerald-400">{bounty.status}</div>
        <h1 className="mt-2 text-2xl font-semibold text-white">{bounty.title}</h1>
        <p className="mt-4 text-sm leading-6 text-zinc-300">{bounty.description}</p>
        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-zinc-500">Client</dt>
            <dd className="break-all text-zinc-200">{bounty.client}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Solver</dt>
            <dd className="break-all text-zinc-200">{bounty.solver ?? "Unclaimed"}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Amount</dt>
            <dd className="text-zinc-200">{bounty.amount}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Deadline</dt>
            <dd className="text-zinc-200">
              {new Date(bounty.deadline * 1000).toLocaleString()}
            </dd>
          </div>
        </dl>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {isOpen ? (
            <button
              type="button"
              disabled={actionLoading || deadlinePassed}
              onClick={() =>
                void runAction("Claim bounty", (solver) => claimBounty(bounty.id, solver, sign))
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-emerald-500 px-4 text-sm font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <HandCoins aria-hidden="true" size={17} />
              <span>{actionLoading ? "Working" : "Claim bounty"}</span>
            </button>
          ) : null}
          {isClaimed && isClient ? (
            <>
              <label className="inline-flex h-11 items-center gap-2 rounded-md border border-zinc-800 bg-[#08090c] px-3 text-sm text-zinc-300">
                <span>Rating</span>
                <select
                  value={rating}
                  onChange={(event) => setRating(Number(event.target.value))}
                  className="bg-transparent text-white outline-none"
                >
                  {[5, 4, 3, 2, 1].map((value) => (
                    <option key={value} value={value} className="bg-zinc-950">
                      {value}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() =>
                  void runAction("Complete bounty", (client) =>
                    completeBounty(bounty.id, client, rating, sign),
                  )
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-emerald-500 px-4 text-sm font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShieldCheck aria-hidden="true" size={17} />
                <span>Complete</span>
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() =>
                  void runAction("Dispute bounty", (client) => disputeBounty(bounty.id, client, sign))
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-red-500/40 px-4 text-sm font-semibold text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <XCircle aria-hidden="true" size={17} />
                <span>Dispute</span>
              </button>
            </>
          ) : null}
          {isOpen && isClient && deadlinePassed ? (
            <button
              type="button"
              disabled={actionLoading}
              onClick={() =>
                void runAction("Refund bounty", (client) => refundBounty(bounty.id, client, sign))
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-zinc-700 px-4 text-sm font-semibold text-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCcw aria-hidden="true" size={17} />
              <span>Refund</span>
            </button>
          ) : null}
        </div>
        {deadlinePassed && isOpen ? (
          <p className="mt-3 text-sm text-amber-200">Deadline has passed. This bounty can no longer be claimed.</p>
        ) : null}
        {actionMessage ? (
          <div className="mt-4 rounded-md border border-zinc-800 bg-[#08090c] px-3 py-2 text-sm text-zinc-300">
            {actionMessage}
          </div>
        ) : null}
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
