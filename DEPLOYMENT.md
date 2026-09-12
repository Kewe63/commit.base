# Authorized Base Sepolia deployment

This deployment occurred after the local-only implementation phase described in VERIFICATION.md. It does not deploy to mainnet, publish to Vercel, migrate old commitments, or push Git changes.

- Chain: Base Sepolia (84532)
- Vault: 0x37e873517C6204cbf1aC8C9B245130E43e045C5D
- Creation transaction: 0x104bb5796a946a2725bc0c5f7de347b5fb4ddf42cd8350ac8d2e290b922f7a19
- Deployment block: 46720384
- Receipt status: 1 (success)
- USDC: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
- Fixed threshold: 80; max duration: 365 days.

Remote bytecode was compared with the local compiled runtime after normalizing compiler-declared immutable offsets; immutable USDC was independently read and matched. Evidence is saved in contracts/deployments/baseSepolia.json. This is bytecode verification, not public explorer source verification; no explorer API key was configured.

The deployment script initially returned `Deployed code not found` on its immediate latest-state read. A later independent RPC read found the code and successful creation receipt. No second deployment was sent; the dedicated deployer nonce was 1. If a future deployment command fails after broadcast, recover its transaction/receipt before considering another deployment.

The local ignored .env.local now points to this vault and block, with mainnet disabled. The production frontend was rebuilt. At http://localhost:4173 the missing-deployment notice is absent and the final create button is enabled after valid wizard inputs. Browser verification did not connect a wallet or submit a stake; the form was exercised only to inspect button readiness.

After local configuration, the missing-deployment UI test exposed reliance on developer environment. Its fixture now explicitly clears the vault, without changing application behavior. Final verification: 61 frontend tests pass, lint passes, production build passes, git diff --check passes. Signing configuration and .env.local are ignored by Git.

To use the app, connect the user's wallet on Base Sepolia and hold test ETH for gas plus Base Sepolia test USDC for the chosen stake. Deployment-wallet funding does not fund the user's connected wallet.
