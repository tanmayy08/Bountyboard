import { ShieldCheck } from "lucide-react";
import type { ReputationData } from "../types";
import { Card, CardContent } from "./ui/Card";

export function ReputationBadge({ reputation }: { reputation: ReputationData | null }) {
  return (
    <Card>
      <CardContent>
      <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
        <ShieldCheck aria-hidden="true" size={17} className="text-emerald-400" />
        <span>Reputation</span>
      </div>
      <div className="mt-4 text-4xl font-semibold text-white">
        {reputation ? reputation.score : 0}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-zinc-500">Completed</div>
          <div className="font-medium text-white">{reputation?.completed ?? 0}</div>
        </div>
        <div>
          <div className="text-zinc-500">Disputed</div>
          <div className="font-medium text-white">{reputation?.disputed ?? 0}</div>
        </div>
      </div>
      </CardContent>
    </Card>
  );
}
