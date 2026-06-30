export type BountyStatus = "Open" | "Claimed" | "Completed" | "Disputed" | "Refunded";

export interface Bounty {
  id: string;
  client: string;
  solver: string | null;
  title: string;
  description: string;
  amount: string;
  deadline: number;
  status: BountyStatus;
}

export interface ReputationData {
  solver: string;
  completed: number;
  disputed: number;
  score: number;
}

