import {
  ArrowRight,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Gavel,
  ShieldCheck,
  Star,
  Trophy,
} from "lucide-react";
import { Link } from "react-router-dom";

const stats = [
  { label: "Verified testnet flow", value: "Live" },
  { label: "Escrow asset", value: "XLM" },
  { label: "Solver score", value: "100" },
];

const lifecycle = [
  { label: "Posted", icon: ClipboardList },
  { label: "Claimed", icon: ShieldCheck },
  { label: "Paid", icon: CircleDollarSign },
  { label: "Rated", icon: Star },
];

const proof = [
  "Soroban escrow holds bounty funds",
  "Completion calls a separate reputation contract",
  "Disputes reopen work for another solver",
  "Refund path protects expired open bounties",
];

export function LandingPage() {
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
                <div key={item.label} className="rounded-md border border-zinc-800 bg-zinc-950/70 p-3">
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
                        <div className="mt-2 h-3 w-44 rounded-full bg-zinc-200" />
                        <div className="mt-3 h-2 w-56 rounded-full bg-zinc-700" />
                        <div className="mt-2 h-2 w-40 rounded-full bg-zinc-800" />
                      </div>
                      <div className="rounded-md bg-emerald-400 px-2 py-1 text-xs font-semibold text-zinc-950">
                        0.10 XLM
                      </div>
                    </div>
                    <div className="mt-5 h-2 rounded-full bg-zinc-800">
                      <div className="h-2 w-2/3 rounded-full bg-emerald-400" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {["Frontend audit", "Contract review", "UI polish", "Reputation check"].map(
                      (item, index) => (
                        <div key={item} className="rounded-md border border-zinc-800 bg-[#101218] p-3">
                          <div className={index === 1 ? "text-xs text-sky-300" : "text-xs text-zinc-400"}>
                            {index === 1 ? "Claimed" : "Queued"}
                          </div>
                          <div className="mt-3 h-2.5 w-24 rounded-full bg-zinc-300" />
                          <div className="mt-3 h-2 rounded-full bg-zinc-800" />
                        </div>
                      ),
                    )}
                  </div>
                </div>
                <div className="grid gap-3">
                  <div className="rounded-md border border-zinc-800 bg-[#101218] p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-white">
                      <Trophy aria-hidden="true" size={17} className="text-amber-300" />
                      <span>Solver score</span>
                    </div>
                    <div className="mt-4 text-4xl font-semibold text-white">100</div>
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
    </div>
  );
}
