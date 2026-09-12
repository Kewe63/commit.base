# CommitmentVault: local development and lifecycle

**Source changes require a fresh deployment.** Existing deployed contracts are unchanged and may still expose the legacy owner's arbitrary `emergencyWithdraw`. This repository update does not upgrade them, migrate stakes, or remove their administrator. No live deployment is part of this change. Configure a reviewed new address and its chain explicitly in the frontend before using these semantics.

## Reproducible local checks

Use Node 22 or 24 (verified with Node 24.14.1, npm 11.11.0):

```sh
cd contracts
npm ci
npm run compile
npm test
```

Tests always select the in-process Hardhat network, deploy only local mocks, and advance its clock; no `.env`, wallet, public RPC, fork or live token is required. The compiler is the exact lockfile-pinned npm `solc` 0.8.20 build, resolved locally by Hardhat. Direct dependencies are exact versions; commit the package lock along with package changes. `src/test/MockUSDC.sol` is test-only and must never be used as a live asset.

## Exact contract semantics

- `createCommitment(uint256 amount, uint256 durationDays, address penaltyAddress, uint256 threshold)` retains its **four arguments** and returns the assigned ID. Creation requires a positive token-unit amount, **1–365 inclusive** days, nonzero penalty address, and **threshold exactly 80**. All input checks precede token transfer. The one-year bound limits supported UX and timestamp arithmetic. Approve the vault for the intended amount first; failed transfers roll back creation and ID allocation.
- The immutable token must be a nonzero contract address. Deployments are intended for the listed official USDC addresses, not arbitrary ERC20 assets: fee-on-transfer and rebasing tokens are unsupported. Code presence alone does not authenticate a token.
- `checkin(id)` requires an existing, unfinalized record belonging to the caller. **The first checkin is intentionally available immediately**. Subsequent checkins require at least **86,400 seconds** since the previous one, not a new calendar date. The count cannot exceed durationDays.
- Deadline is `startTime + durationDays * 86400`. Checkins require `block.timestamp < deadline` (none at the exact deadline). Completing all checkins does **not** settle early or unlock funds.
- `finalize(id)` requires an existing unfinalized record and `block.timestamp >= deadline`. **Anyone** can call it, but cannot choose the recipient. `checkins * 100 >= durationDays * 80` returns the whole stake to the owner; otherwise the whole stake goes to the recorded penalty recipient. This is equivalent to requiring `ceil(durationDays * 0.8)` checkins. No platform fees, partial payments, admin withdrawals, cancellation, or automatic transaction scheduler exist. Failed token settlement reverts the finalized flag and can be retried; successful settlement cannot repeat.
- The penalty recipient remains user-selected (including the owner if deliberately chosen); the contract enforces attendance arithmetic, not the independence or purpose of that recipient. Incorrect recipient choices are not recoverable through an administrator.
- `getCommitment(id)` rejects nonexistent records. Its tuple remains `(owner, amount, durationDays, checkins, threshold, penaltyAddress, startTime, lastCheckinTime, finalized)`. `getUserCommitments(address)` returns all IDs, including finalized ones, or an empty array. For compatibility the public `commitments(id)` mapping getter still returns Solidity's zero-value tuple for unknown IDs; use `getCommitment` for existence-checked reads.
- **All three event signatures and indexed fields are unchanged**, including `CheckinRecorded(uint256 indexed id, address indexed owner, uint256 checkins)`. Obtain each event's timestamp from its block; timestamps are not added to the event ABI.
- `MAX_DURATION_DAYS()` (365) and `REQUIRED_THRESHOLD()` (80) are new public constants. `owner`, ownership-transfer functions, and `emergencyWithdraw` are deliberately removed. SafeERC20 handles transfers; ReentrancyGuard is retained.

This is administrator-free escrow, not custody-free storage: the contract holds staked tokens until settlement. USDC issuer pause/blocklist rules can prevent transfers; there is no privileged recovery path. Checkins are self-attestations, not independent proof of activity. Users must send a settlement transaction (or rely on another caller) after the deadline.

## Separately authorized deployment only

Copy `.env.example` to a private, ignored `.env` and configure a deployment wallet securely. Keep `CONFIRM_DEPLOY=false` and `ALLOW_MAINNET_DEPLOY=false` during development. Never put secrets in source control or chat. After separate review and authorization, `CONFIRM_DEPLOY=true` enables `npm run deploy:sepolia`; mainnet additionally requires `ALLOW_MAINNET_DEPLOY=true`. Both flags default off. The deployment script checks network selection, key shape, RPC chain ID and token code before deployment, then checks deployed code and the immutable token. Verification uses the existing `verify:sepolia`/`verify:mainnet` commands with address and constructor token argument. Configure `BASESCAN_API_KEY` only if explorer verification is needed.

A fresh testnet deployment, explorer verification, independent contract review and explicit frontend address configuration remain release steps, **not tasks performed by the local test suite**. Do not treat local tests as a professional security audit.

## Dependency review

`npm ci` currently reports 48 audit findings in development tooling (18 low, 10 moderate, 20 high); `npm audit --omit=dev` reports zero production dependency findings. Do not blindly apply `npm audit fix --force`: a Hardhat/plugin major upgrade requires separate compatibility work and rerunning the lifecycle suite. The pinned toolchain makes these remaining findings visible and reproducible; they are not claimed resolved.
