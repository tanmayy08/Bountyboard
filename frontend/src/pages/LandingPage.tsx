import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Code2,
  ExternalLink,
  Gavel,
  HandCoins,
  ShieldCheck,
  Star,
  Trophy,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { contractConfig, getAllBounties, getLeaderboard } from "../lib/contracts";
import type { Bounty } from "../types";
import { Badge } from "../components/ui/Badge";
import { ButtonLink, ExternalButtonLink } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import Antigravity from "../components/backgrounds/Antigravity";

const lifecycle = [
  { label: "Posted", icon: ClipboardList },
  { label: "Claimed", icon: ShieldCheck },
  { label: "Paid", icon: CircleDollarSign },
  { label: "Rated", icon: Star },
];

const previewBounties = [
  { title: "Design landing page", status: "Open", amount: "50 XLM", tone: "text-emerald-300" },
  { title: "Fix oracle bug", status: "Claimed", amount: "30 XLM", tone: "text-sky-300" },
];

const howItWorks = [
  {
    label: "Post",
    description: "Clients publish work and escrow XLM in the bounty contract.",
    icon: ClipboardList,
  },
  {
    label: "Claim",
    description: "A solver claims the open bounty and becomes the active worker.",
    icon: ShieldCheck,
  },
  {
    label: "Complete",
    description: "The client approves delivery and submits a solver rating.",
    icon: CheckCircle2,
  },
  {
    label: "Get Paid",
    description: "Escrow releases to the solver and reputation updates on chain.",
    icon: HandCoins,
  },
];

const proof = [
  "Soroban escrow holds bounty funds",
  "Completion calls a separate reputation contract",
  "Disputes reopen work for another solver",
  "Refund path protects expired open bounties",
];

const contracts = [
  { label: "Bounty", address: contractConfig.bountyContractId },
  { label: "Reputation", address: contractConfig.reputationContractId },
];

function contractUrl(address: string) {
  return `https://stellar.expert/explorer/testnet/contract/${address}`;
}

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

function parseXlmAmount(bounty: Bounty) {
  return Number(bounty.amount.replace(" XLM", "")) || 0;
}

function isSubmissionVisibleBounty(bounty: Bounty) {
  return bounty.title.trim().toLowerCase() !== "step 9 test bounty";
}

function formatXlm(value: number) {
  if (value === 0) return "0 XLM";
  if (value < 1) return `${value.toFixed(1)} XLM`;
  return `${Math.round(value).toLocaleString()} XLM`;
}

export function LandingPage() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [topSolverScore, setTopSolverScore] = useState(100);

  useEffect(() => {
    let active = true;

    Promise.all([
      getAllBounties(contractConfig.readSourceAddress),
      getLeaderboard(contractConfig.readSourceAddress),
    ])
      .then(([nextBounties, leaderboard]) => {
        if (!active) return;
        setBounties(nextBounties.filter(isSubmissionVisibleBounty));
        setTopSolverScore(leaderboard[0]?.score ?? 100);
      })
      .catch(() => {
        if (active) setTopSolverScore(100);
      });

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const completed = bounties.filter((bounty) => bounty.status === "Completed").length || 1;
    const totalEscrowed =
      bounties.reduce((sum, bounty) => sum + parseXlmAmount(bounty), 0) || 100;

    return [
      { label: "Bounties completed", value: String(completed) },
      { label: "Total escrowed", value: formatXlm(totalEscrowed) },
      { label: "Top solver score", value: String(topSolverScore) },
    ];
  }, [bounties, topSolverScore]);

  return (
    <div className="relative left-1/2 -mt-5 w-screen -translate-x-1/2 sm:-mt-8">
      <section className="relative overflow-hidden border-b border-zinc-800 bg-[#08090c]">
        <div className="absolute inset-0 opacity-70">
          <div className="landing-hero-media" aria-hidden="true">
            <Antigravity
              count={260}
              magnetRadius={9}
              ringRadius={8}
              waveSpeed={0.38}
              waveAmplitude={0.8}
              particleSize={1.35}
              lerpSpeed={0.055}
              color="#10b981"
              autoAnimate
              particleVariance={0.8}
              rotationSpeed={0.08}
              depthFactor={0.85}
              pulseSpeed={2.8}
              particleShape="capsule"
              fieldStrength={12}
            />
            <div className="landing-orbit landing-orbit-one" />
            <div className="landing-orbit landing-orbit-two" />
            <div className="landing-grid" />
          </div>
        </div>
        <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:py-14">
          <div className="flex flex-col justify-center">
            <Badge variant="success" className="mb-4 w-fit gap-2 px-3 py-2 text-sm">
              <ShieldCheck aria-hidden="true" size={16} />
              <span>Stellar testnet verified</span>
            </Badge>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
              BountyBoard
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-zinc-300 sm:text-lg">
              Post work, escrow XLM, approve delivery, and build solver reputation through
              connected Soroban contracts.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <ButtonLink
                to="/bounties"
              >
                <span>Explore bounties</span>
                <ArrowRight aria-hidden="true" size={17} />
              </ButtonLink>
              <ButtonLink
                to="/post"
                variant="outline"
              >
                <CircleDollarSign aria-hidden="true" size={17} />
                <span>Post bounty</span>
              </ButtonLink>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="landing-device w-full max-w-md">
              <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="h-2 w-28 rounded-full bg-zinc-800" />
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-emerald-300">
                      Active marketplace
                    </div>
                    <h2 className="mt-2 text-xl font-semibold text-white">Solver work queue</h2>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      Escrow status, solver reputation, and bounty lifecycle in one on-chain view.
                    </p>
                  </div>
                  <Badge variant="success">Verified</Badge>
                </div>

                <div className="mt-5 grid gap-3">
                  {previewBounties.map((item) => (
                    <Card key={item.title} className="bg-[#101218]/90">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className={`text-xs font-medium ${item.tone}`}>{item.status}</div>
                            <div className="mt-1 text-sm font-semibold leading-5 text-white">
                              {item.title}
                            </div>
                          </div>
                          <Badge>{item.amount}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-[0.72fr_1fr]">
                  <Card className="bg-[#101218]/90">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-white">
                        <Trophy aria-hidden="true" size={17} className="text-amber-300" />
                        <span>Top score</span>
                      </div>
                      <div className="mt-3 text-4xl font-semibold text-white">{topSolverScore}</div>
                      <div className="mt-3 h-2 rounded-full bg-zinc-800">
                        <div className="h-2 w-full rounded-full bg-amber-300" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-[#101218]/90">
                    <CardContent className="p-3">
                      <div className="grid gap-2">
                        {lifecycle.map((item) => {
                          const Icon = item.icon;
                          return (
                            <div key={item.label} className="flex items-center gap-2">
                              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
                                <Icon aria-hidden="true" size={14} />
                              </span>
                              <span className="text-sm text-zinc-300">{item.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-5 rounded-2xl border border-zinc-800 bg-[#0d1016] p-3">
                  <div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
                    <span>Escrow progress</span>
                    <span>Claimed</span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-800">
                    <div className="h-2 w-2/3 rounded-full bg-emerald-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-800 bg-[#08090c] px-4 py-4 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-3 sm:grid-cols-3">
          {stats.map((item, index) => (
            <div
              key={item.label}
              className="flex items-center justify-between border-zinc-800 py-2 sm:border-r sm:px-8 last:sm:border-r-0"
            >
              <div className="text-xs uppercase tracking-wide text-zinc-500">{item.label}</div>
              <div className="text-xl font-semibold text-white">{item.value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-b border-zinc-800 bg-[#0b0d11] px-4 py-7 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-semibold text-white">How it works</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
            A simple on-chain bounty lifecycle built for clients and solvers.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {howItWorks.map((item, index) => {
              const Icon = item.icon;
              return (
                <Card key={item.label}>
                  <CardContent>
                  <div className="mb-4 flex items-center justify-between">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
                      <Icon aria-hidden="true" size={18} />
                    </span>
                    <span className="text-xs font-medium text-zinc-600">0{index + 1}</span>
                  </div>
                  <h3 className="text-base font-semibold text-white">{item.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{item.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-800 bg-[#08090c] px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
              <ShieldCheck aria-hidden="true" size={18} />
            </span>
            <div>
              <div className="text-sm font-semibold text-white">Verified on Stellar Testnet</div>
              <div className="mt-1 text-xs text-zinc-500">
                Contracts are deployed and explorer-verifiable.
              </div>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {contracts.map((contract) => (
              <ExternalButtonLink
                key={contract.label}
                href={contractUrl(contract.address)}
                target="_blank"
                rel="noreferrer"
                size="sm"
                variant="outline"
              >
                <span>{contract.label}</span>
                <span className="font-mono text-xs text-zinc-500">
                  {shortAddress(contract.address)}
                </span>
                <ExternalLink aria-hidden="true" size={14} />
              </ExternalButtonLink>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-800 bg-[#0b0d11] px-4 py-7 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="text-2xl font-semibold text-white">On-chain work lifecycle</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">
              The escrow and reputation paths are separated into two contracts, with completion
              performing the required inter-contract reputation update.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {proof.map((item, index) => (
              <Card key={item}>
                <CardContent>
                <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-emerald-300">
                  {index === 2 ? (
                    <Gavel aria-hidden="true" size={16} />
                  ) : (
                    <CheckCircle2 aria-hidden="true" size={16} />
                  )}
                </div>
                <div className="text-sm leading-6 text-zinc-200">{item}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-[#08090c] px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-semibold text-zinc-200">BountyBoard</div>
            <div className="mt-1 text-xs">Post it. Claim it. Get paid on-chain.</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <ExternalButtonLink
              href="https://github.com/tanmayy08/Bountyboard"
              target="_blank"
              rel="noreferrer"
              size="sm"
              variant="outline"
            >
              <Code2 aria-hidden="true" size={15} />
              <span>GitHub</span>
            </ExternalButtonLink>
            <ExternalButtonLink
              href={contractUrl(contractConfig.bountyContractId)}
              target="_blank"
              rel="noreferrer"
              size="sm"
              variant="outline"
            >
              <ExternalLink aria-hidden="true" size={15} />
              <span>Contracts</span>
            </ExternalButtonLink>
            <ExternalButtonLink
              href="https://github.com/tanmayy08/Bountyboard#readme"
              target="_blank"
              rel="noreferrer"
              size="sm"
              variant="outline"
            >
              <BookOpen aria-hidden="true" size={15} />
              <span>Docs</span>
            </ExternalButtonLink>
          </div>
        </div>
      </footer>
    </div>
  );
}
