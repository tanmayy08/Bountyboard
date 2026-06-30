export const contractConfig = {
  bountyContractId: import.meta.env.VITE_BOUNTY_CONTRACT_ID ?? "",
  reputationContractId: import.meta.env.VITE_REPUTATION_CONTRACT_ID ?? "",
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

