import { Link } from "react-router-dom";
import { ArrowRight, Clock } from "lucide-react";
import type { Bounty } from "../types";

export function BountyCard({ bounty }: { bounty: Bounty }) {
  return (
    <article className="rounded-md border border-zinc-800 bg-zinc-950 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-wide text-emerald-400">
            {bounty.status}
          </div>
          <h3 className="mt-1 truncate text-base font-semibold text-white">{bounty.title}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-400">
            {bounty.description}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-sm font-semibold text-white">{bounty.amount}</div>
          <div className="mt-1 flex items-center justify-end gap-1 text-xs text-zinc-500">
            <Clock aria-hidden="true" size={13} />
            <span>{new Date(bounty.deadline * 1000).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
      <Link
        to={`/bounty/${bounty.id}`}
        className="mt-4 inline-flex h-9 items-center gap-2 rounded-md border border-zinc-800 px-3 text-sm text-zinc-200 transition hover:border-emerald-500 hover:text-emerald-300"
      >
        <span>Open</span>
        <ArrowRight aria-hidden="true" size={16} />
      </Link>
    </article>
  );
}

