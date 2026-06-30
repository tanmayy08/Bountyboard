import * as StellarSdk from "@stellar/stellar-sdk";

type StellarNetwork = "testnet" | "mainnet";

const network = (import.meta.env.VITE_STELLAR_NETWORK ?? "testnet") as StellarNetwork;

const requireEnv = (name: keyof ImportMetaEnv): string => {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
};

const configs = {
  testnet: {
    horizonUrl: "https://horizon-testnet.stellar.org",
    rpcUrl: "https://soroban-testnet.stellar.org",
    networkPassphrase: StellarSdk.Networks.TESTNET,
    friendbotUrl: "https://friendbot.stellar.org",
  },
  mainnet: {
    horizonUrl: "https://horizon.stellar.org",
    rpcUrl: import.meta.env.VITE_STELLAR_MAINNET_RPC_URL,
    networkPassphrase: StellarSdk.Networks.PUBLIC,
    friendbotUrl: null,
  },
} satisfies Record<
  StellarNetwork,
  {
    horizonUrl: string;
    rpcUrl: string | undefined;
    networkPassphrase: string;
    friendbotUrl: string | null;
  }
>;

const selected = configs[network];

export const stellarConfig = {
  network,
  horizonUrl: selected.horizonUrl,
  rpcUrl:
    selected.rpcUrl ??
    (network === "mainnet" ? requireEnv("VITE_STELLAR_MAINNET_RPC_URL") : ""),
  networkPassphrase: selected.networkPassphrase,
  friendbotUrl: selected.friendbotUrl,
};

export const horizon = new StellarSdk.Horizon.Server(stellarConfig.horizonUrl);
export const rpc = new StellarSdk.rpc.Server(stellarConfig.rpcUrl);

export function shortenAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 5)}...${address.slice(-5)}`;
}

