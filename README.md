# commit.base

A testnet-first, self-reported habit commitment app on Base. Users approve a vault
to lock USDC, submit onchain check-ins, and explicitly settle after the deadline.
**A check-in proves that a wallet submitted a transaction, not that a habit happened.**
There is no AI verification, x402 payment service, custodial payout backend, or
scheduled keeper. Passing the deadline alone does not broadcast a settlement.

## Architecture and rules

- `src/`: React/Vite frontend, wagmi wallet connection, viem contract reads and writes,
  React Query, and optional Farcaster host readiness integration.
- `contracts/`: vault source, local tests, and deployment tooling. The vault determines
  ownership, locked amounts, check-in timing and finalization. It—not local storage—is
  the source of truth for commitment state.
- Browser storage holds optional habit descriptions/preferences. Clearing it must not
  erase onchain commitments; descriptions may no longer be available on another device.
- After the deadline, an explicit settlement transaction routes the locked stake back
  to the creator if the contract's 80% threshold is met, or to the chosen penalty
  recipient otherwise. Settlement costs network gas. There is no simulated agent fee.
- Check-in windows and deadlines use chain time and the contract's policy, not a local
  calendar-day promise. Review `contracts/src/CommitmentVault.sol` for exact boundaries.

This is experimental software. No external audit, production readiness, automatic
monitoring, verified charity recipient, or refund guarantee is claimed.

## Local setup

Supported toolchain: **Node 24** (pinned to **24.14.1** in `.nvmrc`) and
**npm 11.11.0** (`packageManager` and engines in `package.json`). Node 20/22 are not
supported by this repository's selected toolchain. With nvm installed:

```sh
nvm install
nvm use
npm install --global npm@11.11.0
npm ci
cp .env.example .env
npm run dev
```

Open the localhost URL printed by Vite. No agent server or private key is needed.
The app defaults to **Base Sepolia**. With no configured vault, it can render but
must not accept deposits. Use test ETH for gas and test USDC only after verifying
the intended testnet token and newly deployed vault.

## Public frontend configuration

All `VITE_*` settings are embedded in the browser bundle. **Never put private keys,
seed phrases, secret RPC credentials, or signing tokens in them.** Set values before
`npm run build`; changing host environment variables afterwards does not rewrite an
existing build. Restart Vite after local changes.

| Variable | Meaning |
| --- | --- |
| `VITE_VAULT_ADDRESS_BASE_SEPOLIA` | Address of a newly deployed, verified vault on Base Sepolia; blank disables writes. |
| `VITE_DEPLOYMENT_BLOCK_BASE_SEPOLIA` | Decimal deployment block for event recovery; use the actual block. `0` scans from genesis and may hit RPC limits. |
| `VITE_ENABLE_MAINNET` | Defaults off. Only literal `true` opts into real-money Base mainnet. |
| `VITE_VAULT_ADDRESS_BASE` | Newly deployed and verified Base mainnet vault; not a legacy address copied from an old build. |
| `VITE_DEPLOYMENT_BLOCK_BASE` | Decimal deployment block for the mainnet vault. |
| `VITE_RPC_URL_BASE_SEPOLIA` / `VITE_RPC_URL_BASE` | Optional public RPC URL for the respective chain; blank uses its default. Any embedded API key will be public. |

The chain, vault address and commitment ID together identify a commitment. Selecting
a different deployment does not migrate or delete records on the previous vault.
Public RPC access may be rate-limited or unavailable; an RPC error is not proof that
a wallet has no commitments.

History recovery is bounded and resumable: each manual or 60-second refresh scans
at most five 2,000-block pages (ten log queries). A partial-history notice remains
until the scan catches up; partial data is never presented as a complete streak.
Further refreshes resume from the last checkpoint, and completed scans fetch new
blocks only. Checkpoints are in memory and reset on reload; older deployments may
need multiple refreshes. Use the actual deployment block to avoid unnecessary scans.
History errors do not prevent viewing onchain totals or submitting settlement.

## New deployment and legacy migration warning

**These source changes require a NEW contract deployment.** Review the contract
package's configuration and deployment script, run its local tests, deploy to
Sepolia with a separately secured test account, verify the deployed bytecode, token
address and constructor settings, then record the address and deployment block above.
The reviewed public Sepolia address and block are now supplied in `.env.production`
for static production builds; see `DEPLOYMENT.md` and `contracts/deployments/baseSepolia.json`.
That file contains no secrets. Development settings and other deployment environments
remain explicit; Vercel project variables can override the public defaults. Mainnet opt-in is
not a safety certification; require independent review before using real assets.

Old deployments remain independent. Updating the UI or removing an owner function
from source does **not** remove emergency-withdrawal power from old deployed code.
Legacy owners may still control that power and existing approvals may still exist.
Do not point the new ABI at a legacy vault, send tokens directly to an address, or
assume balances automatically transfer to the new vault. Inventory old commitments
and approvals, verify each old contract's real rules with its maintainer, and use a
separately reviewed recovery/settlement procedure. Revoke obsolete allowances where
appropriate; revoking an allowance does not retrieve funds already locked.

The old `api/` and `agent-backend/` services have been removed from this tree. Remove
any separately running old server, stale serverless deployment and unnecessary
hosting secrets through your normal operations process; a local source deletion
does not shut down an existing hosted service. No backend migration or payout
reconciliation is provided.

## Tests and static hosting

```sh
npm ci
npm run lint
npm test
npm run build
npm run preview
# Independent local contract suite:
cd contracts
npm ci
npm test
```

CI runs frontend install/lint/tests/build and a separate contract install/test job.
See [CONTRIBUTING.md](CONTRIBUTING.md) for test discovery and dependency guidelines.
These checks do not deploy or submit live transactions.

Deploy the generated `dist/` as a static Vite site. `vercel.json` has no API rewrites
or payment functions, and Vite has no backend proxy. Configure public environment
values on the build host and select Node 24/npm 11.11.0. Hosting is a separate,
operator-approved action; the repository checks do not verify a live deployment.

### Farcaster

The application dynamically loads the SDK and notifies host readiness only when
running inside a Mini App. Host detection failures do not block standalone use.
The existing domain-bound `public/.well-known/farcaster.json` is preserved for
`commit-base.vercel.app`; its signed association has not been independently verified
in this review. For a different domain, generate and verify a new association and
update the manifest URLs. Never reuse another domain's association.

Wallet connectivity currently uses injected EIP-1193 providers. A dedicated Mini App
wallet connector and host-device end-to-end validation are not included; readiness
alone does not certify embedded-wallet support or a published Mini App.
No webhook backend is provided.

## Security and licensing

See [SECURITY.md](SECURITY.md) for private reporting and trust boundaries. Dependency
audit warnings must be assessed before a release; a successful install is not a
clean security audit.

**Project-wide license decision pending owner approval.** No license has been chosen
on the owner's behalf. Existing third-party/source-file notices do not grant a
project-wide license; obtain permission before assuming reuse or redistribution rights.
