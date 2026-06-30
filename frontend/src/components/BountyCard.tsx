import { Link } from "react-router-dom";
import { ArrowRight, Clock } from "lucide-react";
import type { Bounty } from "../types";
import { Badge } from "./ui/Badge";
import { ButtonLink } from "./ui/Button";
import { Card, CardContent } from "./ui/Card";

export function BountyCard({ bounty }: { bounty: Bounty }) {
  return (
    <Card as="article">
      <CardContent>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Badge variant={bounty.status === "Open" ? "success" : "default"}>
            {bounty.status}
          </Badge>
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
      <ButtonLink
        to={`/bounty/${bounty.id}`}
        className="mt-4"
        size="sm"
        variant="outline"
      >
        <span>Open</span>
        <ArrowRight aria-hidden="true" size={16} />
      </ButtonLink>
      </CardContent>
    </Card>
  );
}
