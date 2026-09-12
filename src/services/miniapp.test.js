import { describe, expect, it, vi } from 'vitest';
import { notifyMiniAppReady } from './miniapp';

describe('optional Mini App readiness', () => {
  it('notifies the host only inside a Mini App', async () => {
    const sdk = { isInMiniApp: vi.fn().mockResolvedValue(true), actions: { ready: vi.fn() } };
    await expect(notifyMiniAppReady(async () => ({ sdk }))).resolves.toBe(true);
    expect(sdk.actions.ready).toHaveBeenCalledOnce();
  });
  it('leaves standalone browser operation independent of the host', async () => {
    const sdk = { isInMiniApp: vi.fn().mockResolvedValue(false), actions: { ready: vi.fn() } };
    await expect(notifyMiniAppReady(async () => ({ sdk }))).resolves.toBe(false);
    expect(sdk.actions.ready).not.toHaveBeenCalled();
  });
  it('does not crash the application when host detection fails', async () => {
    await expect(notifyMiniAppReady(async () => { throw new Error('host unavailable'); })).resolves.toBe(false);
  });
});
