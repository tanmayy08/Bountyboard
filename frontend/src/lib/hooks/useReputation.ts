import { useEffect, useState } from "react";
import type { ReputationData } from "../../types";
import { missingContractConfig } from "../contracts";

export function useReputation(address: string | undefined) {
  const [state, setState] = useState<{
    error: string | null;
    loading: boolean;
    reputation: ReputationData | null;
  }>({
    error: null,
    loading: true,
    reputation: null,
  });

  useEffect(() => {
    const configError = missingContractConfig();
    setState({
      error: configError ?? (address ? null : "Solver address is missing."),
      loading: false,
      reputation: null,
    });
  }, [address]);

  return state;
}

export function useLeaderboard() {
  const [state, setState] = useState<{
    error: string | null;
    leaderboard: ReputationData[];
    loading: boolean;
  }>({
    error: null,
    leaderboard: [],
    loading: true,
  });

  useEffect(() => {
    setState({
      error: missingContractConfig(),
      leaderboard: [],
      loading: false,
    });
  }, []);

  return state;
}

