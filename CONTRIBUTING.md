# Contributing

## Setup and checks

Use Node **24.14.1** (`nvm install && nvm use`) and npm **11.11.0**
(`npm install --global npm@11.11.0`). The supported Node line is 24; root engines
reject unsupported versions. Keep `package.json` and `package-lock.json` together.

```sh
npm ci
npm run lint
npm test
npm run build
cd contracts
npm ci
npm test
```

Root ESLint checks browser source separately from Node configuration and contract
scripts; generated contract artifacts/cache, dependencies and build output are ignored.
Frontend tests use Vitest, jsdom, React Testing Library and user-event. Put tests in
`src/**/*.{test,spec}.{js,jsx,ts,tsx}`; shared DOM cleanup and jest-dom matchers are
configured in `vitest.setup.js`. Import Vitest APIs explicitly where practical.
Use `npm run test:watch` for interactive work. A normal `npm test` fails if no tests
are found: `--passWithNoTests` is only a temporary integration diagnostic, never a
release or coverage claim. No coverage percentage is asserted by these commands.

Test wallet rejection, reverted receipts, wrong-chain/account changes, reload
recovery, duplicate actions, validation boundaries and settlement. Mock wallet/RPC
clients; contract tests use local mock tokens. Never use funded accounts or real
transactions in CI. A passing mocked suite does not validate a deployed contract,
wallet vendor integration, or production RPC reliability.

## Dependency changes

Use ordinary npm resolution, not `--force` or `--legacy-peer-deps`. TypeScript 5.9.3
is an explicit dev dependency to satisfy wallet libraries' optional peer constraints;
the JavaScript app is not thereby type-checked. Regenerate the lock with the pinned
npm version and prove it with `npm ci`. If repairing a corrupted lock, resolve from
a clean temporary directory containing the manifest and `.npmrc`, then copy the
resulting lock back and run `npm ci`; do not derive it from stale `node_modules`.
Review `npm audit` results separately from lint/test/build success.

## Change review

Keep changes focused and add regression tests for behavior fixes. Document any
contract ABI/lifecycle change and update frontend consumers. Do not deploy, migrate
funds, push changes, or rotate keys as an incidental part of a code change. Follow
[SECURITY.md](SECURITY.md) for private security reporting.

## License decision pending

The repository owner has not selected a project-wide license. Do not add one or
assume public visibility grants general reuse rights. Existing third-party notices
and source-file license identifiers remain their own; they do not settle the
license of the entire project. Obtain the owner's decision before redistribution.
