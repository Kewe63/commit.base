# Security policy

## Report privately

Do not post vulnerabilities, keys, or exploitable details in public issues or pull requests.
Use the repository's **Security → Report a vulnerability** flow if private vulnerability
reporting is enabled. If that option is unavailable, ask a maintainer for a private
reporting channel with a minimal, non-sensitive message. No dedicated reporting email
or response-time guarantee has been established here; do not guess a recipient.

Once a private channel is confirmed, include the affected revision, component and
network, impact, prerequisites, and a minimal local test using mock assets. Never
send seed phrases or private keys. Do not test against other people's wallets,
production services, or funded deployments without separate permission.

## Trust and deployment boundaries

- Check-ins are self-reported; the app cannot verify real-world habit completion.
- Blockchain records and wallet addresses are public. RPC providers can observe queries.
- Browser metadata is untrusted convenience data, not proof of ownership or payment.
- All `VITE_*` variables are public in the built frontend. No backend signing key is required.
- This is experimental software, not an audited or insured custody product. Tests are
  not an external security audit. Use testnet before considering any real funds.
- Source fixes do not change previously deployed immutable vaults. Legacy deployments
  may still have owner emergency-withdrawal power. Check the deployed bytecode and
  administration, not just this branch, before approving or depositing tokens.

The current source branch is the maintenance target; no support promise is made for
old deployments. Review dependency audit output as part of release review. Do not
blindly apply major-version overrides or `npm audit fix --force` to financial code.
