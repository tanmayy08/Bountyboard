import { useEffect, useMemo, useRef, useState } from "react";
import { contractConfig, missingContractConfig } from "../contracts";
import { rpc } from "../stellar";

interface ContractEventState {
  error: string | null;
  latestLedger: number | null;
  lastEventAt: string | null;
  listening: boolean;
}

interface UseContractEventsOptions {
  enabled?: boolean;
  intervalMs?: number;
  onEvent?: () => void;
}

export function useContractEvents({
  enabled = true,
  intervalMs = 5_000,
  onEvent,
}: UseContractEventsOptions = {}) {
  const callbackRef = useRef(onEvent);
  const [state, setState] = useState<ContractEventState>({
    error: null,
    latestLedger: null,
    lastEventAt: null,
    listening: false,
  });

  const contractIds = useMemo(
    () =>
      [contractConfig.bountyContractId, contractConfig.reputationContractId].filter(
        Boolean,
      ),
    [],
  );

  useEffect(() => {
    callbackRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    let active = true;
    let timer: number | undefined;
    let nextStartLedger: number | null = null;

    async function poll() {
      if (!active || !enabled) return;

      const configError = missingContractConfig();
      if (configError || contractIds.length === 0) {
        setState({
          error: configError ?? "Contract addresses are not configured.",
          latestLedger: null,
          lastEventAt: null,
          listening: false,
        });
        return;
      }

      try {
        if (nextStartLedger === null) {
          const latest = await rpc.getLatestLedger();
          nextStartLedger = latest.sequence;
          if (active) {
            setState((current) => ({
              ...current,
              error: null,
              latestLedger: latest.sequence,
              listening: true,
            }));
          }
          return;
        }

        const response = await rpc.getEvents({
          startLedger: nextStartLedger,
          filters: [{ type: "contract", contractIds }],
          limit: 100,
        });

        nextStartLedger = response.latestLedger + 1;

        if (!active) return;

        if (response.events.length > 0) {
          callbackRef.current?.();
        }

        const lastEvent = response.events[response.events.length - 1];
        setState({
          error: null,
          latestLedger: response.latestLedger,
          lastEventAt: lastEvent?.ledgerClosedAt ?? lastEvent?.id ?? null,
          listening: true,
        });
      } catch (error) {
        if (!active) return;
        setState((current) => ({
          ...current,
          error: error instanceof Error ? error.message : "Unable to read contract events.",
          listening: false,
        }));
      }
    }

    void poll();
    timer = window.setInterval(() => void poll(), intervalMs);

    return () => {
      active = false;
      if (timer) window.clearInterval(timer);
    };
  }, [contractIds, enabled, intervalMs]);

  return state;
}
