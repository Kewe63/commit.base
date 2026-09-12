import { isAddress, parseUnits, zeroAddress } from 'viem';
export const DAY = 86400n;
export const sameAddress = (a, b) => Boolean(a && b && a.toLowerCase() === b.toLowerCase());
export const commitmentKey = (chainId, vault, id) => `${chainId}:${vault.toLowerCase()}:${BigInt(id)}`;
export function validateCreation(form, vault) {
  if (!form.name?.trim() || form.name.trim().length > 80) throw new Error('invalidName');
  if (!/^[0-9]+(?:\.[0-9]{1,6})?$/.test(form.amount)) throw new Error('invalidAmount');
  const amount = parseUnits(form.amount, 6);
  if (amount <= 0n || amount >= 2n ** 256n) throw new Error('invalidAmount');
  if (!/^[0-9]+$/.test(form.duration) || BigInt(form.duration) < 1n || BigInt(form.duration) > 365n) throw new Error('invalidDuration');
  if (!isAddress(form.penalty) || sameAddress(form.penalty, zeroAddress) || sameAddress(form.penalty, vault)) throw new Error('invalidPenalty');
  return { amount, durationDays: BigInt(form.duration), penalty: form.penalty, name: form.name.trim(), details: String(form.details || '').slice(0, 300) };
}
export function readMetadata(key, storage) {
  try {
    const value = JSON.parse((storage ?? globalThis.localStorage).getItem(`commit:metadata:${key}`));
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(['name', 'details'].filter(k => typeof value[k] === 'string').map(k => [k, value[k].slice(0, k === 'name' ? 80 : 300)]));
  } catch { return {}; }
}
export function saveMetadata(key, metadata, storage) {
  try {
    (storage ?? globalThis.localStorage).setItem(`commit:metadata:${key}`, JSON.stringify({ name: metadata.name, details: metadata.details }));
    return true;
  } catch { return false; }
}
export function historyStats(events, now) {
  const dates = [...new Set(events.map(e => new Date(Number(e.timestamp) * 1000).toISOString().slice(0, 10)))].sort();
  const days = new Set(events.map(e => (e.timestamp / DAY).toString()));
  let cursor = now / DAY;
  if (!days.has(cursor.toString())) cursor--;
  let streak = 0;
  while (days.has(cursor.toString())) { streak++; cursor--; }
  return { dates, streak };
}
export function lifecycle(c, now) {
  const deadline = c.startTime + c.durationDays * DAY;
  return { deadline, canFinalize: !c.finalized && now >= deadline, canCheckin: !c.finalized && now < deadline && c.checkins < c.durationDays && (c.lastCheckinTime === 0n || now >= c.lastCheckinTime + DAY) };
}
export const dateTime = (timestamp, lang) => new Date(Number(timestamp) * 1000).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-GB', { timeZone: 'UTC' });
