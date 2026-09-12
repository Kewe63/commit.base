import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ connected: false, wrongNetwork: false, data: null, activity: null, locked: false, refresh: vi.fn(), transact: vi.fn() }));
vi.mock('./hooks/useVault', () => ({ useVault: () => state }));
vi.mock('./ui/InteractiveBG', () => ({ default: () => <canvas aria-hidden="true" /> }));
vi.mock('./components/WalletControls', () => ({ default: () => <button>Wallet</button> }));
import App from './App';
import { networkSettings, networks } from './config';
import { messages } from './i18n';
const configuredVault = networks[0].vault;
afterEach(() => { cleanup(); networks[0].vault = configuredVault; });
beforeEach(() => { networks[0].vault = null; state.connected = false; state.locked = false; state.data = null; });
describe('testnet-first explorable app', () => {
  it('renders without a wallet or deployment, translates, and changes theme', () => {
    const { container } = render(<App />);
    expect(screen.getByText(messages.tr.setup)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: messages.tr.language }));
    expect(screen.getByText(messages.en.setup)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Custom Habit/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: messages.en.theme }));
    expect(container.firstChild.dataset.theme).toBe('light');
    expect(document.documentElement.lang).toBe('en');
    expect(screen.getByRole('option', { name: 'Base Sepolia' }).selected).toBe(true);
  });
  it('routes original dashboard tabs, keeps settled records, and locks network selection', () => {
    networks[0].vault = '0x1111111111111111111111111111111111111111';
    state.connected = true;
    state.locked = true;
    state.data = { now: 186400n, historyState: 'partial', commitments: [{ id: 2n, amount: 5000000n, durationDays: 1n, startTime: 100000n, lastCheckinTime: 0n, checkins: 0n, finalized: true, success: false, penaltyAddress: '0x3333333333333333333333333333333333333333' }] };
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Dashboard' }));
    expect(screen.getByText(messages.tr.paidPenalty)).toBeTruthy();
    expect(screen.getByRole('combobox', { name: messages.tr.network })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'takvim' }));
    expect(screen.getByText('TAAHHÜT TAKVİMİ · UTC')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'kontrat' }));
    expect(screen.getByText('KONTRAT BİLGİSİ')).toBeTruthy();
    expect(screen.getByRole('link', { name: '0x1111…1111 ↗' }).href).toBe('https://sepolia.basescan.org/address/0x1111111111111111111111111111111111111111');
    fireEvent.click(screen.getByRole('button', { name: 'Yeni Ekle' }));
    expect(screen.getByRole('heading', { name: 'Taahhüdünü oluştur' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Spor/ })).toBeDisabled();
  });
  it('does not enable mainnet unless explicitly true', () => {
    expect(networkSettings({}).map(n => n.chain.id)).toEqual([84532]);
    expect(networkSettings({ VITE_ENABLE_MAINNET: 'false' }).map(n => n.chain.id)).toEqual([84532]);
    expect(networkSettings({ VITE_ENABLE_MAINNET: 'true' }).map(n => n.chain.id)).toEqual([84532, 8453]);
  });
  it('never falls back to a hardcoded vault or deployment block', () => {
    expect(networkSettings({})[0]).toMatchObject({ vault: null, deploymentBlock: null });
    expect(networkSettings({ VITE_VAULT_ADDRESS_BASE_SEPOLIA: '0x0000000000000000000000000000000000000000', VITE_DEPLOYMENT_BLOCK_BASE_SEPOLIA: '-1' })[0]).toMatchObject({ vault: null, deploymentBlock: null });
  });
});
