/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STELLAR_NETWORK?: "testnet" | "mainnet";
  readonly VITE_STELLAR_MAINNET_RPC_URL?: string;
  readonly VITE_BOUNTY_CONTRACT_ID?: string;
  readonly VITE_REPUTATION_CONTRACT_ID?: string;
  readonly VITE_READ_SOURCE_ADDRESS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
