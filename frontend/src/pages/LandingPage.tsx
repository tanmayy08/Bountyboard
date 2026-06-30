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
import { Link } from "react-router-dom";
import { contractConfig, getAllBounties, getLeaderboard } from "../lib/contracts";
import type { Bounty } from "../types";

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
        setBounties(nextBounties);
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
    <div className="-mx-4 -mt-5 sm:-mx-6 sm:-mt-8">
      <section className="relative min-h-[calc(100vh-64px)] overflow-hidden border-b border-zinc-800 bg-[#08090c]">
        <div className="absolute inset-0 opacity-70">
          <div className="landing-hero-media" aria-hidden="true">
            <div className="landing-orbit landing-orbit-one" />
            <div className="landing-orbit landing-orbit-two" />
            <div className="landing-grid" />
          </div>
        </div>
        <div className="relative mx-auto grid min-h-[calc(100vh-64px)] max-w-6xl content-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:py-12">
          <div className="flex flex-col justify-center">
            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
              <ShieldCheck aria-hidden="true" size={16} />
              <span>Stellar testnet verified</span>
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              BountyBoard
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-zinc-300 sm:text-lg">
              Post work, escrow XLM, approve delivery, and build solver reputation through
              connected Soroban contracts.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/bounties"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-emerald-500 px-4 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
              >
                <span>Explore bounties</span>
                <ArrowRight aria-hidden="true" size={17} />
              </Link>
              <Link
                to="/post"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-zinc-700 bg-zinc-950/70 px-4 text-sm font-semibold text-zinc-100 transition hover:border-sky-400 hover:text-sky-200"
              >
                <CircleDollarSign aria-hidden="true" size={17} />
                <span>Post bounty</span>
              </Link>
            </div>
            <div className="mt-8 grid max-w-xl grid-cols-3 gap-2">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-md border border-zinc-800 bg-zinc-950/70 p-3"
                >
                  <div className="text-xl font-semibold text-white">{item.value}</div>
                  <div className="mt-1 text-xs leading-5 text-zinc-500">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex min-h-[420px] items-center lg:min-h-[560px]">
            <div className="landing-device w-full">
              <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="h-2 w-28 rounded-full bg-zinc-800" />
              </div>
              <div className="grid gap-4 p-4 lg:grid-cols-[1fr_0.72fr]">
                <div className="grid gap-3">
                  <div className="rounded-md border border-zinc-800 bg-[#101218] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs text-emerald-300">Open bounty</div>
                        <div className="mt-2 text-base font-semibold text-white">
                          Design landing page
                        </div>
                        <p className="mt-2 max-w-56 text-sm leading-6 text-zinc-400">
                          Build a polished hero, lifecycle flow, and verified deployment links.
                        </p>
                      </div>
                      <div className="rounded-md bg-emerald-400 px-2 py-1 text-xs font-semibold text-zinc-950">
                        50 XLM
                      </div>
                    </div>
                    <div className="mt-5 h-2 rounded-full bg-zinc-800">
                      <div className="h-2 w-2/3 rounded-full bg-emerald-400" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {previewBounties.map((item) => (
                      <div
                        key={item.title}
                        className="rounded-md border border-zinc-800 bg-[#101218] p-3"
                      >
                        <div className={`text-xs font-medium ${item.tone}`}>{item.status}</div>
                        <div className="mt-2 text-sm font-semibold leading-5 text-white">
                          {item.title}
                        </div>
                        <div className="mt-3 inline-flex rounded-md border border-zinc-800 px-2 py-1 text-xs text-zinc-300">
                          {item.amount}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="rounded-md border border-zinc-800 bg-[#101218] p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-white">
                      <Trophy aria-hidden="true" size={17} className="text-amber-300" />
                      <span>Solver score</span>
                    </div>
                    <div className="mt-4 text-4xl font-semibold text-white">{topSolverScore}</div>
                    <div className="mt-3 h-2 rounded-full bg-zinc-800">
                      <div className="h-2 w-full rounded-full bg-amber-300" />
                    </div>
                  </div>
                  <div className="rounded-md border border-zinc-800 bg-[#101218] p-4">
                    <div className="grid gap-3">
                      {lifecycle.map((item, index) => {
                        const Icon = item.icon;
                        return (
                          <div key={item.label} className="flex items-center gap-3">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-300">
                              <Icon aria-hidden="true" size={16} />
                            </span>
                            <span className="text-sm text-zinc-300">{item.label}</span>
                            {index < lifecycle.length - 1 ? (
                              <span className="ml-auto h-px w-8 bg-zinc-700" />
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-800 bg-[#0b0d11] px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-semibold text-white">How it works</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
            A simple on-chain bounty lifecycle built for clients and solvers.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {howItWorks.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-md border border-zinc-800 bg-zinc-950 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-300">
                      <Icon aria-hidden="true" size={18} />
                    </span>
                    <span className="text-xs font-medium text-zinc-600">0{index + 1}</span>
                  </div>
                  <h3 className="text-base font-semibold text-white">{item.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-800 bg-[#08090c] px-4 py-5 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 rounded-md border border-emerald-500/20 bg-emerald-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-300">
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
              <a
                key={contract.label}
                href={contractUrl(contract.address)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-200 transition hover:border-emerald-500 hover:text-emerald-200"
              >
                <span>{contract.label}</span>
                <span className="font-mono text-xs text-zinc-500">
                  {shortAddress(contract.address)}
                </span>
                <ExternalLink aria-hidden="true" size={14} />
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-800 bg-[#0b0d11] px-4 py-10 sm:px-6">
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
              <div key={item} className="rounded-md border border-zinc-800 bg-zinc-950 p-4">
                <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-md bg-zinc-900 text-emerald-300">
                  {index === 2 ? (
                    <Gavel aria-hidden="true" size={16} />
                  ) : (
                    <CheckCircle2 aria-hidden="true" size={16} />
                  )}
                </div>
                <div className="text-sm leading-6 text-zinc-200">{item}</div>
              </div>
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
            <a
              href="https://github.com/tanmayy08/Bountyboard"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-800 px-3 transition hover:border-emerald-500 hover:text-emerald-200"
            >
              <Code2 aria-hidden="true" size={15} />
              <span>GitHub</span>
            </a>
            <a
              href={contractUrl(contractConfig.bountyContractId)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-800 px-3 transition hover:border-emerald-500 hover:text-emerald-200"
            >
              <ExternalLink aria-hidden="true" size={15} />
              <span>Contracts</span>
            </a>
            <a
              href="https://github.com/tanmayy08/Bountyboard#readme"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-800 px-3 transition hover:border-emerald-500 hover:text-emerald-200"
            >
              <BookOpen aria-hidden="true" size={15} />
              <span>Docs</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
