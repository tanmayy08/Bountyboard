const bountyErrors: Record<number, string> = {
  1: "Amount must be greater than zero.",
  2: "Deadline must be in the future.",
  3: "Bounty was not found on-chain.",
  4: "Bounty id overflowed.",
  5: "This bounty is not open, so it cannot be claimed.",
  6: "The bounty deadline has already passed.",
  7: "This bounty is not claimed yet.",
  8: "The bounty deadline has not passed yet.",
  9: "This bounty has no assigned solver.",
  10: "Rating must be between 1 and 5.",
};

export function formatContractError(message: string): string {
  const code = message.match(/Error\(Contract,\s*#(\d+)\)/)?.[1];
  if (!code) return message;

  const readable = bountyErrors[Number(code)];
  return readable ? `${readable} (${code})` : message;
}
