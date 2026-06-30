import { ArrowRight, Clock } from "lucide-react";
import { bountyStatusVariant, normalizeBountyStatus } from "../lib/bountyStatus";
import type { Bounty } from "../types";
import { Badge } from "./ui/Badge";
import { ButtonLink } from "./ui/Button";
import { Card, CardContent } from "./ui/Card";

function amountToNumber(amount: string) {
  return Number(amount.replace(" XLM", "")) || 0;
}

export function BountyCard({ bounty, xlmUsdPrice }: { bounty: Bounty; xlmUsdPrice: number | null }) {
  const amount = amountToNumber(bounty.amount);
  const usdValue = xlmUsdPrice ? amount * xlmUsdPrice : null;
  const status = normalizeBountyStatus(bounty.status);

  return (
    <Card as="article" className="h-full">
      <CardContent className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Badge variant={bountyStatusVariant(status)}>
            {status}
          </Badge>
          <h3 className="mt-2 line-clamp-2 min-h-12 text-base font-semibold leading-6 text-white">
            {bounty.title}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-400">
            {bounty.description}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-sm font-semibold text-white">{bounty.amount}</div>
          {usdValue ? (
            <div className="mt-1 text-xs text-zinc-500">
              ${usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
          ) : null}
          <div className="mt-1 flex items-center justify-end gap-1 text-xs text-zinc-500">
            <Clock aria-hidden="true" size={13} />
            <span>{new Date(bounty.deadline * 1000).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
      <ButtonLink
        to={`/bounty/${bounty.id}`}
        className="mt-4 w-fit"
        size="sm"
        variant="outline"
      >
        <span>View details</span>
        <ArrowRight aria-hidden="true" size={16} />
      </ButtonLink>
      </CardContent>
    </Card>
  );
}
