import { useEffect, useMemo, useState } from "react";
import type { Bounty, BountyStatus } from "../../types";
import { missingContractConfig } from "../contracts";

interface BountyState {
  bounties: Bounty[];
  error: string | null;
  loading: boolean;
}

export function useBounties(status?: BountyStatus | "All") {
  const [state, setState] = useState<BountyState>({
    bounties: [],
    error: null,
    loading: true,
  });

  useEffect(() => {
    const configError = missingContractConfig();
    setState({
      bounties: [],
      error: configError,
      loading: false,
    });
  }, []);

  const bounties = useMemo(() => {
    if (!status || status === "All") return state.bounties;
    return state.bounties.filter((bounty) => bounty.status === status);
  }, [state.bounties, status]);

  return {
    ...state,
    bounties,
  };
}

export function useBounty(id: string | undefined) {
  const [state, setState] = useState<{
    bounty: Bounty | null;
    error: string | null;
    loading: boolean;
  }>({
    bounty: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    const configError = missingContractConfig();
    setState({
      bounty: null,
      error: configError ?? (id ? null : "Bounty id is missing."),
      loading: false,
    });
  }, [id]);

  return state;
}

