/**
 * Deterministic stringify + RSA-SHA256 sign/verify primitives.
 *
 * stableStringify must produce byte-identical output to QA Architect's
 * shipped lib/license-signing.js — the deployed CLI in customers' hands
 * uses that exact algorithm. Any divergence here breaks every QAA license
 * issued to date.
 */

import { sign as cryptoSign, verify as cryptoVerify, createHash } from 'crypto';

export function stableStringify(value: unknown, seen: WeakSet<object> = new WeakSet()): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (seen.has(value as object)) {
    throw new Error('Circular reference detected in payload - cannot serialize');
  }
  seen.add(value as object);

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item, seen)).join(',')}]`;
  }
  const keys = Object.keys(value as Record<string, unknown>).sort();
  const entries = keys.map(
    (key) =>
      `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key], seen)}`,
  );
  return `{${entries.join(',')}}`;
}

export function signPayload(payload: unknown, privateKeyPem: string): string {
  const data = Buffer.from(stableStringify(payload));
  return cryptoSign(null, data, privateKeyPem).toString('base64');
}

export function verifyPayload(payload: unknown, signature: string, publicKeyPem: string): boolean {
  try {
    const data = Buffer.from(stableStringify(payload));
    return cryptoVerify(null, data, publicKeyPem, Buffer.from(signature, 'base64'));
  } catch {
    return false;
  }
}

export function computeHash(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Constant-time string comparison. Same length precondition is checked
 * outside the comparison loop to avoid leaking length info.
 */
export function timingSafeStringEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
