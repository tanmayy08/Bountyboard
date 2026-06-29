# BountyBoard

Post it. Claim it. Get paid on-chain.

BountyBoard is a Stellar dApp for posting on-chain bounties, claiming work, releasing escrowed rewards, and tracking solver reputation through Soroban contracts.

## Stack

- Contracts: Rust + Soroban SDK
- Frontend: React + TypeScript + Vite + Tailwind CSS
- Wallet: Freighter
- Chain: Stellar Soroban

## Architecture

- `contracts/bounty`: escrow and bounty lifecycle contract
- `contracts/reputation`: solver reputation contract
- `frontend`: React client for listing, posting, claiming, and reputation views

The critical contract integration is:

```text
bounty_contract::complete_bounty()
  -> reputation_contract::update_score(solver, rating)
```

## Planned Bounty Lifecycle

```text
Open -> Claimed -> Completed
Open -> Claimed -> Disputed -> Open
Open -> Refunded
```

## Development

```bash
cargo test
cargo build --release --target wasm32-unknown-unknown
cd frontend && npm install
cd frontend && npm run dev
```

