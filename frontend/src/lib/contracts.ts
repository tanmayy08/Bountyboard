import * as StellarSdk from "@stellar/stellar-sdk";
import type { Bounty, BountyStatus, ReputationData } from "../types";
import { rpc, stellarConfig } from "./stellar";

const STROOPS_PER_XLM = 10_000_000n;

export type SignTransaction = (xdr: string, networkPassphrase: string) => Promise<string>;

export const contractConfig = {
  bountyContractId: import.meta.env.VITE_BOUNTY_CONTRACT_ID ?? "",
  reputationContractId: import.meta.env.VITE_REPUTATION_CONTRACT_ID ?? "",
  readSourceAddress: import.meta.env.VITE_READ_SOURCE_ADDRESS ?? "",
};

export function missingContractConfig(): string | null {
  if (!contractConfig.bountyContractId) {
    return "Bounty contract address is not configured.";
  }
  if (!contractConfig.reputationContractId) {
    return "Reputation contract address is not configured.";
  }
  return null;
}

export function missingReadSource(address?: string | null): string | null {
  if (contractConfig.readSourceAddress || address) return null;
  return "Connect Freighter or set VITE_READ_SOURCE_ADDRESS to read contract state.";
}

export function assertWalletNetwork(walletNetwork: string | null) {
  if (!walletNetwork) return;
  const normalized = walletNetwork.toLowerCase();
  const expected =
    stellarConfig.network === "mainnet"
      ? ["mainnet", "public", "pubnet"]
      : ["testnet", "test sdf network ; september 2015"];

  if (!expected.some((name) => normalized.includes(name))) {
    throw new Error(`Wallet is on ${walletNetwork}. Switch Freighter to ${stellarConfig.network}.`);
  }
}

function sourceAddress(address?: string | null): string {
  const source = contractConfig.readSourceAddress || address;
  if (!source) throw new Error("A funded Stellar address is required for contract reads.");
  return source;
}

function addressVal(address: string) {
  return StellarSdk.Address.fromString(address).toScVal();
}

function stringVal(value: string) {
  return StellarSdk.nativeToScVal(value, { type: "string" });
}

function u64Val(value: number | bigint) {
  return StellarSdk.nativeToScVal(BigInt(value), { type: "u64" });
}

function u32Val(value: number) {
  return StellarSdk.nativeToScVal(value, { type: "u32" });
}

function i128Val(value: bigint) {
  return StellarSdk.nativeToScVal(value, { type: "i128" });
}

function parseXlmToStroops(value: string): bigint {
  const normalized = value.trim();
  if (!/^\d+(\.\d{1,7})?$/.test(normalized)) {
    throw new Error("Amount must be a positive number with up to 7 decimals.");
  }

  const [whole, fractional = ""] = normalized.split(".");
  const stroops = BigInt(whole) * STROOPS_PER_XLM + BigInt(fractional.padEnd(7, "0"));
  if (stroops <= 0n) throw new Error("Amount must be greater than zero.");
  return stroops;
}

function formatStroops(value: unknown): string {
  const stroops = BigInt(value as bigint | number | string);
  const whole = stroops / STROOPS_PER_XLM;
  const fraction = (stroops % STROOPS_PER_XLM).toString().padStart(7, "0").replace(/0+$/, "");
  return `${whole}${fraction ? `.${fraction}` : ""} XLM`;
}

function nativeAddress(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && "toString" in value) return String(value);
  return String(value);
}

function nativeField(source: unknown, field: string): unknown {
  if (source instanceof Map) return source.get(field);
  if (source && typeof source === "object") {
    return (source as Record<string, unknown>)[field];
  }
  return undefined;
}

function nativeStatus(value: unknown): BountyStatus {
  if (Array.isArray(value)) {
    return nativeStatus(value[0]);
  }
  if (typeof value === "number" || typeof value === "bigint") {
    const statuses: BountyStatus[] = ["Open", "Claimed", "Completed", "Disputed", "Refunded"];
    return statuses[Number(value)] ?? "Open";
  }
  if (typeof value === "string") {
    if (/^\d+$/.test(value)) {
      const statuses: BountyStatus[] = ["Open", "Claimed", "Completed", "Disputed", "Refunded"];
      return statuses[Number(value)] ?? "Open";
    }
    return value as BountyStatus;
  }
  if (value instanceof Map) {
    const first = value.keys().next().value;
    return String(first) as BountyStatus;
  }
  if (value && typeof value === "object") {
    const first = Object.keys(value)[0];
    if (first) return first as BountyStatus;
  }
  return "Open";
}

function normalizeResult(value: unknown): unknown {
  if (value instanceof Map && value.has("Ok")) return value.get("Ok");
  if (value && typeof value === "object" && "Ok" in value) {
    return (value as { Ok: unknown }).Ok;
  }
  return value;
}

function parseBounty(value: unknown): Bounty {
  const bounty = normalizeResult(value);
  const solver = nativeField(bounty, "solver");

  return {
    id: String(nativeField(bounty, "id") ?? ""),
    client: nativeAddress(nativeField(bounty, "client")),
    solver: solver ? nativeAddress(solver) : null,
    title: String(nativeField(bounty, "title") ?? ""),
    description: String(nativeField(bounty, "description") ?? ""),
    amount: formatStroops(nativeField(bounty, "amount") ?? 0),
    deadline: Number(nativeField(bounty, "deadline") ?? 0),
    status: nativeStatus(nativeField(bounty, "status")),
  };
}

function parseReputation(value: unknown): ReputationData {
  const reputation = normalizeResult(value);

  return {
    solver: nativeAddress(nativeField(reputation, "solver")),
    completed: Number(nativeField(reputation, "completed") ?? 0),
    disputed: Number(nativeField(reputation, "disputed") ?? 0),
    score: Number(nativeField(reputation, "score") ?? 0),
  };
}

function parseLeaderboard(value: unknown): ReputationData[] {
  const rows = normalizeResult(value);
  if (!Array.isArray(rows)) return [];

  return rows.map((row) => {
    const solver = Array.isArray(row) ? row[0] : nativeField(row, "0");
    const score = Array.isArray(row) ? row[1] : nativeField(row, "1");
    return {
      solver: nativeAddress(solver),
      completed: 0,
      disputed: 0,
      score: Number(score ?? 0),
    };
  });
}

async function simulateContract(
  source: string,
  contractId: string,
  method: string,
  args: StellarSdk.xdr.ScVal[],
) {
  const account = await rpc.getAccount(source);
  const contract = new StellarSdk.Contract(contractId);
  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: stellarConfig.networkPassphrase,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(180)
    .build();

  const simulation = await rpc.simulateTransaction(transaction);
  if (StellarSdk.rpc.Api.isSimulationError(simulation)) {
    throw new Error(`Simulation failed: ${simulation.error}`);
  }

  return { simulation, transaction };
}

async function readContract(
  source: string,
  contractId: string,
  method: string,
  args: StellarSdk.xdr.ScVal[] = [],
): Promise<unknown> {
  const { simulation } = await simulateContract(source, contractId, method, args);
  return simulation.result?.retval ? StellarSdk.scValToNative(simulation.result.retval) : null;
}

async function invokeContract(
  source: string,
  contractId: string,
  method: string,
  args: StellarSdk.xdr.ScVal[],
  sign: SignTransaction,
) {
  const { simulation, transaction } = await simulateContract(source, contractId, method, args);
  const prepared = StellarSdk.rpc.assembleTransaction(transaction, simulation).build();
  const signedXdr = await sign(prepared.toXDR(), stellarConfig.networkPassphrase);
  const signedTransaction = StellarSdk.TransactionBuilder.fromXDR(
    signedXdr,
    stellarConfig.networkPassphrase,
  ) as StellarSdk.Transaction;

  const response = await rpc.sendTransaction(signedTransaction);
  if (response.status === "ERROR") {
    throw new Error(`Transaction failed: ${String(response.errorResult)}`);
  }

  let result = await rpc.getTransaction(response.hash);
  while (result.status === "NOT_FOUND") {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    result = await rpc.getTransaction(response.hash);
  }

  if (result.status !== "SUCCESS") {
    throw new Error(`Transaction failed: ${result.status}`);
  }

  return {
    hash: response.hash,
    returnValue: result.returnValue ? StellarSdk.scValToNative(result.returnValue) : null,
  };
}

export async function getBountyCount(readAddress?: string | null): Promise<number> {
  const value = await readContract(
    sourceAddress(readAddress),
    contractConfig.bountyContractId,
    "get_bounty_count",
  );
  return Number(normalizeResult(value) ?? 0);
}

export async function getBounty(bountyId: string | number, readAddress?: string | null) {
  const value = await readContract(
    sourceAddress(readAddress),
    contractConfig.bountyContractId,
    "get_bounty",
    [u64Val(BigInt(bountyId))],
  );
  return parseBounty(value);
}

export async function getAllBounties(readAddress?: string | null) {
  const count = await getBountyCount(readAddress);
  if (count === 0) return [];

  const bounties = await Promise.all(
    Array.from({ length: count }, (_, index) => getBounty(index + 1, readAddress)),
  );
  return bounties;
}

export async function postBounty(input: {
  client: string;
  title: string;
  description: string;
  amount: string;
  deadline: string;
}, sign: SignTransaction) {
  const deadline = Math.floor(new Date(input.deadline).getTime() / 1000);
  return invokeContract(
    input.client,
    contractConfig.bountyContractId,
    "post_bounty",
    [
      addressVal(input.client),
      stringVal(input.title.trim()),
      stringVal(input.description.trim()),
      i128Val(parseXlmToStroops(input.amount)),
      u64Val(deadline),
    ],
    sign,
  );
}

export async function claimBounty(bountyId: string, solver: string, sign: SignTransaction) {
  return invokeContract(
    solver,
    contractConfig.bountyContractId,
    "claim_bounty",
    [u64Val(BigInt(bountyId)), addressVal(solver)],
    sign,
  );
}

export async function completeBounty(
  bountyId: string,
  client: string,
  rating: number,
  sign: SignTransaction,
) {
  return invokeContract(
    client,
    contractConfig.bountyContractId,
    "complete_bounty",
    [u64Val(BigInt(bountyId)), u32Val(rating)],
    sign,
  );
}

export async function disputeBounty(bountyId: string, client: string, sign: SignTransaction) {
  return invokeContract(
    client,
    contractConfig.bountyContractId,
    "dispute_bounty",
    [u64Val(BigInt(bountyId))],
    sign,
  );
}

export async function refundBounty(bountyId: string, client: string, sign: SignTransaction) {
  return invokeContract(
    client,
    contractConfig.bountyContractId,
    "refund_bounty",
    [u64Val(BigInt(bountyId))],
    sign,
  );
}

export async function getReputation(address: string, readAddress?: string | null) {
  const value = await readContract(
    sourceAddress(readAddress),
    contractConfig.reputationContractId,
    "get_score",
    [addressVal(address)],
  );
  return parseReputation(value);
}

export async function getLeaderboard(readAddress?: string | null) {
  const value = await readContract(
    sourceAddress(readAddress),
    contractConfig.reputationContractId,
    "get_leaderboard",
  );
  return parseLeaderboard(value);
}
