import { LogOut, Wallet } from "lucide-react";
import { useFreighter } from "../lib/hooks/useFreighter";
import { shortenAddress } from "../lib/stellar";
import { Button } from "./ui/Button";

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
        <Button
          type="button"
          onClick={disconnect}
          title="Disconnect wallet"
          size="icon"
          variant="danger"
        >
          <LogOut aria-hidden="true" size={18} />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {error ? <span className="hidden max-w-44 truncate text-xs text-red-300 md:block">{error}</span> : null}
      <Button
        type="button"
        onClick={() => void connect()}
        disabled={loading}
        size="sm"
      >
        <Wallet aria-hidden="true" size={17} />
        <span className="hidden sm:inline">{loading ? "Checking" : "Connect"}</span>
      </Button>
    </div>
  );
}
