import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { Bounty } from "../types";
import { BountyCard } from "./BountyCard";

const bounty: Bounty = {
  id: "4",
  client: "GDYC2AUKPBCFS24PIUYXUWPYL46QIQCELNUPTXA6B4SNNNTQJM2BBVP7",
  solver: "GAO7B37UNMUHBZ4JTE6CHLJCRNUW6LTEHX67L6Y5DYA6AJHRQWU2W7BJ",
  title: "Write API docs for reputation contract",
  description:
    "Document update_score, get_score, and leaderboard behavior for frontend and judge review.",
  amount: "150 XLM",
  deadline: 1784570400,
  status: "Claimed",
};

describe("BountyCard", () => {
  it("renders bounty status, reward, deadline, and detail link", () => {
    render(
      <MemoryRouter>
        <BountyCard bounty={bounty} xlmUsdPrice={0.1} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Claimed")).toBeInTheDocument();
    expect(screen.getByText("Write API docs for reputation contract")).toBeInTheDocument();
    expect(screen.getByText("150 XLM")).toBeInTheDocument();
    expect(screen.getByText("$15")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view details/i })).toHaveAttribute(
      "href",
      "/bounty/4",
    );
  });
});
