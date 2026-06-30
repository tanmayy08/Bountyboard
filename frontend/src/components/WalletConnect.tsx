import { LogOut, Wallet } from "lucide-react";
import { useFreighter } from "../lib/hooks/useFreighter";
import { shortenAddress } from "../lib/stellar";

export function WalletConnect() {
  const { address, connected, connect, disconnect, error, loading, network } =
    useFreighter();

  if (connected && address) {
    return (
      <div className="flex min-w-0 items-center gap-2">
        <div className="hidden min-w-0 text-right sm:block">
          <div className="truncate text-sm font-medium text-white">
            {shortenAddress(address)}
          </div>
          <div className="text-xs text-zinc-500">{network ?? "Unknown network"}</div>
        </div>
        <button
          type="button"
          onClick={disconnect}
          title="Disconnect wallet"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-zinc-800 bg-zinc-950 text-zinc-300 transition hover:border-red-500 hover:text-red-300"
        >
          <LogOut aria-hidden="true" size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {error ? <span className="hidden max-w-44 truncate text-xs text-red-300 md:block">{error}</span> : null}
      <button
        type="button"
        onClick={() => void connect()}
        disabled={loading}
        className="inline-flex h-10 items-center gap-2 rounded-md bg-emerald-500 px-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Wallet aria-hidden="true" size={17} />
        <span className="hidden sm:inline">{loading ? "Checking" : "Connect"}</span>
      </button>
    </div>
  );
}
