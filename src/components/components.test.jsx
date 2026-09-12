import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import CreateForm from './CreateForm';
import CommitmentCard from './CommitmentCard';
import TransactionStatus from './TransactionStatus';
import { messages } from '../i18n';
import { baseSepolia } from 'wagmi/chains';
const vault = '0x1111111111111111111111111111111111111111';
const penalty = '0x3333333333333333333333333333333333333333';
const network = { vault, chain: baseSepolia };
const c = { id: 0n, owner: penalty, penaltyAddress: penalty, amount: 5000000n, durationDays: 1n, startTime: 100000n, lastCheckinTime: 0n, checkins: 0n, finalized: false, threshold: 80n };
afterEach(cleanup);
const next = () => fireEvent.click(screen.getByRole('button', { name: 'continue →' }));
function selectCustom() {
  fireEvent.click(screen.getByRole('button', { name: /Custom Habit/ }));
  fireEvent.change(screen.getByLabelText(messages.en.name), { target: { value: 'Read' } });
}

describe('usable creation form', () => {
  it('can explore habits without deployment but cannot submit', () => {
    render(<CreateForm t={messages.en} vault={null} onCreate={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Read/ }));
    next();
    expect(screen.getByLabelText(messages.en.duration).value).toBe('30');
    next();
    fireEvent.change(screen.getByLabelText(messages.en.penalty), { target: { value: penalty } });
    next();
    expect(screen.getByText('Reading')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Approve & create/ }).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: '← back' }));
    expect(screen.getByLabelText(messages.en.amount).value).toBe('10');
  });
  it('validates malformed amount before invoking a transaction', () => {
    const create = vi.fn();
    render(<CreateForm t={messages.en} vault={vault} onCreate={create} />);
    selectCustom();
    next();
    next();
    fireEvent.change(screen.getByLabelText('Penalty recipient address'), { target: { value: penalty } });
    fireEvent.change(screen.getByLabelText('Stake amount (USDC)'), { target: { value: '0.0000001' } });
    next();
    expect(screen.getByRole('alert').textContent).toBe(messages.en.invalidAmount);
    expect(create).not.toHaveBeenCalled();
  });
  it('submits user data and disables the full form during approval', () => {
    const create = vi.fn();
    const { rerender } = render(<CreateForm t={messages.en} vault={vault} onCreate={create} />);
    selectCustom();
    next();
    next();
    fireEvent.change(screen.getByLabelText('Penalty recipient address'), { target: { value: penalty } });
    next();
    fireEvent.click(screen.getByRole('button', { name: /Approve & create/ }));
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Read', amount: '10', duration: '30', penalty }));
    rerender(<CreateForm t={messages.en} vault={vault} onCreate={create} disabled />);
    expect(screen.getByRole('button', { name: /Approve & create/ }).disabled).toBe(true);
  });
});
describe('wizard navigation', () => {
  it('preserves custom fields, presets and exact decimals when navigating back', () => {
    const create = vi.fn();
    render(<CreateForm t={messages.en} vault={vault} onCreate={create} />);
    expect(screen.getByRole('button', { name: 'continue →' })).toBeDisabled();
    selectCustom();
    fireEvent.change(screen.getByLabelText(messages.en.details), { target: { value: '20 pages' } });
    next();
    fireEvent.click(screen.getByRole('button', { name: '14 DAYS' }));
    next();
    fireEvent.change(screen.getByLabelText(messages.en.amount), { target: { value: '0.000001' } });
    fireEvent.change(screen.getByLabelText(messages.en.penalty), { target: { value: penalty } });
    fireEvent.click(screen.getByRole('button', { name: '← back' }));
    expect(screen.getByLabelText(messages.en.duration).value).toBe('14');
    next();
    expect(screen.getByLabelText(messages.en.amount).value).toBe('0.000001');
    next();
    fireEvent.click(screen.getByRole('button', { name: messages.en.create }));
    expect(create).toHaveBeenCalledWith({ name: 'Read', details: '20 pages', duration: '14', amount: '0.000001', penalty });
  });
  it('rejects out-of-policy durations and zero/vault recipients', () => {
    render(<CreateForm t={messages.en} vault={vault} onCreate={vi.fn()} />);
    selectCustom(); next();
    fireEvent.change(screen.getByLabelText(messages.en.duration), { target: { value: '366' } });
    expect(screen.getByRole('button', { name: 'continue →' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText(messages.en.duration), { target: { value: '7' } });
    next();
    fireEvent.change(screen.getByLabelText(messages.en.penalty), { target: { value: vault } });
    next();
    expect(screen.getByRole('alert')).toHaveTextContent(messages.en.invalidPenalty);
  });
});
describe('authoritative lifecycle display', () => {
  it('offers explicit finalize at deadline even if history is unavailable', () => {
    const action = vi.fn();
    render(<CommitmentCard commitment={c} network={network} now={186400n} historyState="unavailable" onAction={action} lang="en" t={messages.en} />);
    expect(screen.getByRole('button', { name: messages.en.checkin }).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: messages.en.finalize }));
    expect(action).toHaveBeenCalledWith('finalize', 0n);
    expect(screen.getByText(messages.en.historyUnavailable)).toBeTruthy();
    expect(screen.queryByText(/1970-/)).toBeNull();
  });
  it('does not offer early finalize after all check-ins', () => {
    render(<CommitmentCard commitment={{ ...c, checkins: 1n }} network={network} now={100000n} historyState="unavailable" onAction={vi.fn()} lang="en" t={messages.en} />);
    expect(screen.getByRole('button', { name: messages.en.finalize }).disabled).toBe(true);
    expect(screen.getByText(messages.en.endWait)).toBeTruthy();
  });
  it('shows finalized results from chain, with no pending refund fiction', () => {
    render(<CommitmentCard commitment={{ ...c, finalized: true, success: false }} network={network} now={186400n} historyState="unavailable" onAction={vi.fn()} lang="tr" t={messages.tr} />);
    expect(screen.getByText(messages.tr.paidPenalty)).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });
  it('renders calendar dates only from complete real event history', () => {
    const props = { commitment: { ...c, durationDays: 3n, checkins: 1n }, network, now: 200000n, onAction: vi.fn(), lang: 'en', t: messages.en, tab: 'calendar' };
    const { rerender } = render(<CommitmentCard {...props} historyState="partial" />);
    expect(screen.getAllByText(messages.en.historyPartial).length).toBeGreaterThan(0);
    expect(document.querySelectorAll('.calendar-day')).toHaveLength(0);
    rerender(<CommitmentCard {...props} historyState="ready" history={{ checkins: [{ timestamp: 186400n, hash: '0x123' }] }} />);
    expect(screen.getByLabelText('1970-01-03 ✓')).toBeTruthy();
    expect(screen.getByLabelText('1970-01-02')).toBeTruthy();
    expect(screen.getByRole('link', { name: /1970/ }).href).toBe('https://sepolia.basescan.org/tx/0x123');
  });
  it.each([{ locked: true }, { wrongNetwork: true }])('locks dashboard writes in unsafe context %j', flags => {
    render(<CommitmentCard commitment={c} network={network} now={186400n} historyState="partial" onAction={vi.fn()} lang="en" t={messages.en} {...flags} />);
    expect(screen.getByRole('button', { name: messages.en.checkin })).toBeDisabled();
    expect(screen.getByRole('button', { name: messages.en.finalize })).toBeDisabled();
  });
  it('shows a real chain-specific receipt link', () => {
    render(<TransactionStatus t={messages.en} activity={{ stage: 'confirming', hash: '0xabc', chain: baseSepolia }} locked />);
    expect(screen.getByRole('link').getAttribute('href')).toBe('https://sepolia.basescan.org/tx/0xabc');
    expect(screen.queryByText(messages.en.confirmed)).toBeNull();
  });
  it('keeps both translation dictionaries complete', () => expect(Object.keys(messages.en).sort()).toEqual(Object.keys(messages.tr).sort()));
});
