import { createConfig, http } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
import { isAddress, zeroAddress } from 'viem';

export function networkSettings(env = import.meta.env) {
  return [baseSepolia, ...(env.VITE_ENABLE_MAINNET === 'true' ? [base] : [])].map(chain => {
    const suffix = chain.id === base.id ? 'BASE' : 'BASE_SEPOLIA';
    const address = env[`VITE_VAULT_ADDRESS_${suffix}`];
    const block = env[`VITE_DEPLOYMENT_BLOCK_${suffix}`];
    return {
      chain,
      vault: address && isAddress(address) && address.toLowerCase() !== zeroAddress ? address : null,
      deploymentBlock: typeof block === 'string' && /^\d+$/.test(block) ? BigInt(block) : null,
      rpc: env[`VITE_RPC_URL_${suffix}`] || undefined,
    };
  });
}
export const networks = networkSettings();
export const config = createConfig({
  chains: networks.map(n => n.chain),
  connectors: [injected()],
  transports: Object.fromEntries(networks.map(n => [n.chain.id, http(n.rpc)])),
});
