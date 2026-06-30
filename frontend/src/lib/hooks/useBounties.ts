import { useEffect, useMemo, useState } from "react";
import type { Bounty, BountyStatus } from "../../types";
import { getAllBounties, getBounty, missingContractConfig, missingReadSource } from "../contracts";
import { useFreighter } from "./useFreighter";

interface BountyState {
  bounties: Bounty[];
  error: string | null;
  loading: boolean;
}

export function useBounties(status?: BountyStatus | "All") {
  const { address } = useFreighter();
  const [state, setState] = useState<BountyState>({
    bounties: [],
    error: null,
    loading: true,
  });

  useEffect(() => {
    let active = true;
    const configError = missingContractConfig();
    const sourceError = missingReadSource(address);

    if (configError || sourceError) {
      setState({
        bounties: [],
        error: configError ?? sourceError,
        loading: false,
      });
      return;
    }

    setState((current) => ({ ...current, error: null, loading: true }));
    getAllBounties(address)
      .then((bounties) => {
        if (active) setState({ bounties, error: null, loading: false });
      })
      .catch((error) => {
        if (active) {
          setState({
            bounties: [],
            error: error instanceof Error ? error.message : "Unable to load bounties.",
            loading: false,
          });
        }
      });

    return () => {
      active = false;
    };
  }, [address]);

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
  const { address } = useFreighter();
  const [refreshKey, setRefreshKey] = useState(0);
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
    let active = true;
    const configError = missingContractConfig();
    const sourceError = missingReadSource(address);

    if (configError || sourceError || !id) {
      setState({
        bounty: null,
        error: configError ?? sourceError ?? "Bounty id is missing.",
        loading: false,
      });
      return;
    }

    setState((current) => ({ ...current, error: null, loading: true }));
    getBounty(id, address)
      .then((bounty) => {
        if (active) setState({ bounty, error: null, loading: false });
      })
      .catch((error) => {
        if (active) {
          setState({
            bounty: null,
            error: error instanceof Error ? error.message : "Unable to load bounty.",
            loading: false,
          });
        }
      });

    return () => {
      active = false;
    };
  }, [address, id, refreshKey]);

  return {
    ...state,
    refresh: () => setRefreshKey((current) => current + 1),
  };
}
