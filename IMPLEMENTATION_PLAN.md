# Reliable commitment lifecycle implementation plan

Goal: turn the prototype into a runnable, tested, honest testnet-first application without making live financial transactions.

Architecture: the vault is authoritative for ownership, stake, timestamps, checkins and settlement. Browser storage contains optional descriptive metadata only. Remove the obsolete custodial payout API and false AI/x402 claims. Existing deployed contracts are legacy; source updates require a new deployment and explicit address configuration.

Acceptance gates:
- Receipt success and exact event decoding; no guessed IDs or fabricated transactions.
- Recover commitments from configured chain, including finalized state; compound chain/vault/id keys.
- Explicit settlement action after deadline, real checkin history and derived streak/calendar. History advances at most five 2,000-block pages per manual/60-second refresh, with partial state and in-memory continuation (reload resets). `loadHistory(client, ctx, toBlock, {previous, pageSize, maxPages, isCurrent})` returns `{scope, history, seen, nextBlock, complete}`; completed checkpoints request deltas only.
- Validate inputs before approval; transaction-wide lock; meaningful pending/error states.
- Default Sepolia, mainnet explicit opt-in, deployment address required and legacy administration disclosed.
- Contract has no arbitrary admin withdrawal, enforces deadline/threshold policy, emits sufficient events. Use SafeERC20.
- Local unit/integration tests with mock token only; no live RPC mutations.
- Reproducible npm ci, clean lint/build/test/contract checks, CI, env/docs/security guidance.
- Preserve useful theme/language/responsive UI; semantic controls and chain explorer URLs.

Workstreams (disjoint ownership):
1. contracts/**: write tests, refine vault and test local lifecycle/boundaries, update deploy docs. No live deployment.
2. src/** plus frontend tests: modularize state/chain/service/UI, preserve style, implement lifecycle using viem/wagmi, add tests.
3. root package/tooling, API/backend decommission, docs/CI: reproducible setup, remove payment service, configure Vitest and browser-based frontend test support.

Parent: inspect integration, run full gates, launch localhost and inspect browser, independent final review. No commits or pushes without separate delivery scope. Do not invent a legal license; document owner decision instead.
