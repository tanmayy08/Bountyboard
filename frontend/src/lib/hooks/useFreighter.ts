import { useCallback, useEffect, useState } from "react";
import {
  getAddress,
  getNetwork,
  isConnected,
  requestAccess,
  signTransaction,
} from "@stellar/freighter-api";

interface WalletState {
  address: string | null;
  connected: boolean;
  error: string | null;
  loading: boolean;
  network: string | null;
}

export function useFreighter() {
  const [state, setState] = useState<WalletState>({
    address: null,
    connected: false,
    error: null,
    loading: true,
    network: null,
  });

  const checkConnection = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const { isConnected: installed, error } = await isConnected();
      if (error || !installed) {
        setState({
          address: null,
          connected: false,
          error: null,
          loading: false,
          network: null,
        });
        return;
      }

      const { address, error: addressError } = await getAddress();
      if (addressError || !address) {
        setState({
          address: null,
          connected: false,
          error: null,
          loading: false,
          network: null,
        });
        return;
      }

      const { network, error: networkError } = await getNetwork();
      if (networkError) throw new Error(networkError.message);

      setState({
        address,
        connected: true,
        error: null,
        loading: false,
        network,
      });
    } catch (error) {
      setState({
        address: null,
        connected: false,
        error: error instanceof Error ? error.message : "Unable to read wallet state.",
        loading: false,
        network: null,
      });
    }
  }, []);

  useEffect(() => {
    void checkConnection();
  }, [checkConnection]);

  const connect = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const { isConnected: installed, error } = await isConnected();
      if (error || !installed) throw new Error("Freighter extension is not installed.");

      const { address, error: accessError } = await requestAccess();
      if (accessError) throw new Error(accessError.message);

      const { network, error: networkError } = await getNetwork();
      if (networkError) throw new Error(networkError.message);

      setState({
        address,
        connected: true,
        error: null,
        loading: false,
        network,
      });
      return address;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to connect wallet.";
      setState({
        address: null,
        connected: false,
        error: message,
        loading: false,
        network: null,
      });
      throw new Error(message);
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({
      address: null,
      connected: false,
      error: null,
      loading: false,
      network: null,
    });
  }, []);

  const sign = useCallback(
    async (xdr: string, networkPassphrase: string) => {
      const { signedTxXdr, error } = await signTransaction(xdr, {
        networkPassphrase,
      });
      if (error) throw new Error(error.message);
      return signedTxXdr;
    },
    [],
  );

  return {
    ...state,
    checkConnection,
    connect,
    disconnect,
    sign,
  };
}
