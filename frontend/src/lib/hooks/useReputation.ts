import { useEffect, useState } from "react";
import type { ReputationData } from "../../types";
import {
  getLeaderboard,
  getReputation,
  missingContractConfig,
  missingReadSource,
} from "../contracts";
import { useFreighter } from "./useFreighter";

export function useReputation(address: string | undefined) {
  const { address: readAddress } = useFreighter();
  const [refreshKey, setRefreshKey] = useState(0);
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
    let active = true;
    const configError = missingContractConfig();
    const sourceError = missingReadSource(readAddress);

    if (configError || sourceError || !address) {
      setState({
        error: configError ?? sourceError ?? "Solver address is missing.",
        loading: false,
        reputation: null,
      });
      return;
    }

    setState((current) => ({ ...current, error: null, loading: true }));
    getReputation(address, readAddress)
      .then((reputation) => {
        if (active) setState({ error: null, loading: false, reputation });
      })
      .catch((error) => {
        if (active) {
          setState({
            error: error instanceof Error ? error.message : "Unable to load reputation.",
            loading: false,
            reputation: null,
          });
        }
      });

    return () => {
      active = false;
    };
  }, [address, readAddress, refreshKey]);

  return {
    ...state,
    refresh: () => setRefreshKey((current) => current + 1),
  };
}

export function useLeaderboard() {
  const { address } = useFreighter();
  const [refreshKey, setRefreshKey] = useState(0);
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
    let active = true;
    const configError = missingContractConfig();
    const sourceError = missingReadSource(address);

    if (configError || sourceError) {
      setState({
        error: configError ?? sourceError,
        leaderboard: [],
        loading: false,
      });
      return;
    }

    setState((current) => ({ ...current, error: null, loading: true }));
    getLeaderboard(address)
      .then((leaderboard) => {
        if (active) setState({ error: null, leaderboard, loading: false });
      })
      .catch((error) => {
        if (active) {
          setState({
            error: error instanceof Error ? error.message : "Unable to load leaderboard.",
            leaderboard: [],
            loading: false,
          });
        }
      });

    return () => {
      active = false;
    };
  }, [address, refreshKey]);

  return {
    ...state,
    refresh: () => setRefreshKey((current) => current + 1),
  };
}
