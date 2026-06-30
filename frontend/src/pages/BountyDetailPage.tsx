import { useParams } from "react-router-dom";
import {
  CheckCircle2,
  Circle,
  Clock,
  HandCoins,
  RefreshCcw,
  ShieldCheck,
  UserCheck,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { StateBlock } from "../components/StateBlock";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { Select } from "../components/ui/Select";
import {
  assertWalletNetwork,
  claimBounty,
  completeBounty,
  disputeBounty,
  refundBounty,
} from "../lib/contracts";
import { bountyStatusLabel, bountyStatusVariant, normalizeBountyStatus } from "../lib/bountyStatus";
import { useBounty } from "../lib/hooks/useBounties";
import { useFreighter } from "../lib/hooks/useFreighter";
import { shortenAddress } from "../lib/stellar";

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

  const status = normalizeBountyStatus(bounty.status);
  const connectedAddress = address?.toLowerCase();
  const isClient = connectedAddress === bounty.client.toLowerCase();
  const isOpen = status === "Open";
  const isClaimed = status === "Claimed";
  const isCompleted = status === "Completed";
  const isSolver = Boolean(address && bounty.solver?.toLowerCase() === address.toLowerCase());
  const deadlinePassed = bounty.deadline > 0 && Date.now() / 1000 > bounty.deadline;
  const statusIndex = Math.max(0, timeline.indexOf(status));
  const actionTitle = isOpen
    ? "Available to claim"
    : isClaimed
      ? "Work is in progress"
      : isCompleted
        ? "Bounty completed"
        : "Bounty status";
  const actionDescription = isOpen
    ? "Connect Freighter on testnet and claim this bounty. Once claimed, your wallet becomes the solver on-chain."
    : isClaimed
      ? isClient
        ? "You are the client. Approve the work to release escrow, or dispute it to reopen the bounty."
        : isSolver
          ? "You are the solver for this bounty. Submit the work off-chain; the client releases escrow here."
          : "This bounty is already claimed by another solver. You can track its status, but cannot claim it."
      : isCompleted
        ? "Escrow has been released to the solver and reputation has been updated on-chain."
        : "This bounty is not open for new solver claims.";

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
      <Card as="section">
        <CardContent className="p-5">
        <Badge variant={bountyStatusVariant(status)}>{status}</Badge>
        <h1 className="mt-2 text-2xl font-semibold text-white">{bounty.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-300">{bounty.description}</p>
        <div className="mt-5 grid gap-3 rounded-2xl border border-zinc-800 bg-[#08090c] p-4 text-sm sm:grid-cols-3">
          <div>
            <div className="text-zinc-500">Reward</div>
            <div className="mt-1 text-xl font-semibold text-white">{bounty.amount}</div>
          </div>
          <div>
            <div className="text-zinc-500">Deadline</div>
            <div className="mt-1 flex items-center gap-2 text-zinc-200">
              <Clock aria-hidden="true" size={15} className="text-zinc-500" />
              <span>{new Date(bounty.deadline * 1000).toLocaleString()}</span>
            </div>
          </div>
          <div>
            <div className="text-zinc-500">Current state</div>
            <div className="mt-1 text-zinc-200">
              {bountyStatusLabel(status)}
            </div>
          </div>
        </div>
        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-zinc-500">Client</dt>
            <dd className="break-all text-zinc-200" title={bounty.client}>
              {shortenAddress(bounty.client)}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Solver</dt>
            <dd className="break-all text-zinc-200" title={bounty.solver ?? undefined}>
              {bounty.solver ? shortenAddress(bounty.solver) : "No solver yet"}
            </dd>
          </div>
        </dl>
        <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
              <HandCoins aria-hidden="true" size={18} />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-white">How payout works</h2>
              <p className="mt-1 text-sm leading-6 text-zinc-400">
                A solver claims this bounty, completes the requested work, and the client releases
                escrow from the Soroban contract. Completion also updates solver reputation.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:hidden">
          {isOpen ? (
            <Button
              type="button"
              disabled={actionLoading || deadlinePassed}
              onClick={() =>
                void runAction("Claim bounty", (solver) => claimBounty(bounty.id, solver, sign))
              }
            >
              <HandCoins aria-hidden="true" size={17} />
              <span>{actionLoading ? "Working" : "Claim bounty"}</span>
            </Button>
          ) : null}
          {isClaimed && isClient ? (
            <>
              <label className="inline-flex h-11 items-center gap-2 rounded-full border border-zinc-800 bg-[#08090c] px-3 text-sm text-zinc-300">
                <span>Rating</span>
                <Select
                  value={rating}
                  onChange={(event) => setRating(Number(event.target.value))}
                >
                  {[5, 4, 3, 2, 1].map((value) => (
                    <option key={value} value={value} className="bg-zinc-950">
                      {value}
                    </option>
                  ))}
                </Select>
              </label>
              <Button
                type="button"
                disabled={actionLoading}
                onClick={() =>
                  void runAction("Complete bounty", (client) =>
                    completeBounty(bounty.id, client, rating, sign),
                  )
                }
              >
                <ShieldCheck aria-hidden="true" size={17} />
                <span>Complete</span>
              </Button>
              <Button
                type="button"
                disabled={actionLoading}
                onClick={() =>
                  void runAction("Dispute bounty", (client) => disputeBounty(bounty.id, client, sign))
                }
                variant="danger"
              >
                <XCircle aria-hidden="true" size={17} />
                <span>Dispute</span>
              </Button>
            </>
          ) : null}
          {isOpen && isClient && deadlinePassed ? (
            <Button
              type="button"
              disabled={actionLoading}
              onClick={() =>
                void runAction("Refund bounty", (client) => refundBounty(bounty.id, client, sign))
              }
              variant="outline"
            >
              <RefreshCcw aria-hidden="true" size={17} />
              <span>Refund</span>
            </Button>
          ) : null}
        </div>
        {deadlinePassed && isOpen ? (
          <p className="mt-3 text-sm text-amber-200">Deadline has passed. This bounty can no longer be claimed.</p>
        ) : null}
        {actionMessage ? (
          <div className="mt-4 rounded-xl border border-zinc-800 bg-[#08090c] px-3 py-2 text-sm text-zinc-300 lg:hidden">
            {actionMessage}
          </div>
        ) : null}
        </CardContent>
      </Card>
      <Card as="aside">
        <CardContent>
        <h2 className="text-sm font-semibold text-white">{actionTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-400">{actionDescription}</p>
        <div className="mt-4 hidden flex-col gap-3 lg:flex">
          {isOpen ? (
            <Button
              type="button"
              disabled={actionLoading || deadlinePassed}
              onClick={() =>
                void runAction("Claim bounty", (solver) => claimBounty(bounty.id, solver, sign))
              }
            >
              <HandCoins aria-hidden="true" size={17} />
              <span>{actionLoading ? "Working" : "Claim bounty"}</span>
            </Button>
          ) : null}
          {isClaimed && isClient ? (
            <>
              <label className="grid gap-2 text-sm text-zinc-300">
                <span>Rating</span>
                <Select
                  value={rating}
                  onChange={(event) => setRating(Number(event.target.value))}
                >
                  {[5, 4, 3, 2, 1].map((value) => (
                    <option key={value} value={value} className="bg-zinc-950">
                      {value}
                    </option>
                  ))}
                </Select>
              </label>
              <Button
                type="button"
                disabled={actionLoading}
                onClick={() =>
                  void runAction("Complete bounty", (client) =>
                    completeBounty(bounty.id, client, rating, sign),
                  )
                }
              >
                <ShieldCheck aria-hidden="true" size={17} />
                <span>Complete and pay</span>
              </Button>
              <Button
                type="button"
                disabled={actionLoading}
                onClick={() =>
                  void runAction("Dispute bounty", (client) => disputeBounty(bounty.id, client, sign))
                }
                variant="danger"
              >
                <XCircle aria-hidden="true" size={17} />
                <span>Dispute</span>
              </Button>
            </>
          ) : null}
          {isClaimed && !isClient ? (
            <div className="rounded-2xl border border-zinc-800 bg-[#08090c] p-3 text-sm text-zinc-400">
              <UserCheck aria-hidden="true" size={17} className="mb-2 text-sky-300" />
              {isSolver ? "You claimed this bounty." : "Another solver has claimed this bounty."}
            </div>
          ) : null}
          {isCompleted ? (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-200">
              <CheckCircle2 aria-hidden="true" size={17} className="mb-2" />
              Paid and reputation updated.
            </div>
          ) : null}
        </div>
        {actionMessage ? (
          <div className="mt-4 rounded-xl border border-zinc-800 bg-[#08090c] px-3 py-2 text-sm text-zinc-300">
            {actionMessage}
          </div>
        ) : null}
        <div className="mt-6 border-t border-zinc-800 pt-4">
        <h2 className="text-sm font-semibold text-white">Status timeline</h2>
        <div className="mt-4 grid gap-3">
          {timeline.map((item, index) => {
            const reached = index <= statusIndex;
            const active = index === statusIndex;
            return (
              <div key={item} className="flex items-center gap-2 text-sm">
                {reached ? (
                  <CheckCircle2 aria-hidden="true" size={17} className="text-emerald-400" />
                ) : (
                  <Circle aria-hidden="true" size={17} className="text-zinc-600" />
                )}
                <span className={active ? "text-white" : reached ? "text-zinc-300" : "text-zinc-500"}>
                  {item}
                </span>
              </div>
            );
          })}
        </div>
        </div>
        </CardContent>
      </Card>
    </div>
  );
}
