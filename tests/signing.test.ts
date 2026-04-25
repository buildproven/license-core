import { describe, it, expect } from 'vitest';
import { generateKeyPairSync } from 'crypto';
import {
  stableStringify,
  signPayload,
  verifyPayload,
  computeHash,
  timingSafeStringEqual,
} from '../src/signing.js';

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

describe('stableStringify', () => {
  it('sorts object keys alphabetically', () => {
    expect(stableStringify({ z: 1, a: 2, m: 3 })).toBe('{"a":2,"m":3,"z":1}');
  });

  it('handles nested objects with sorted keys', () => {
    expect(stableStringify({ b: { y: 1, a: 2 }, a: 'x' })).toBe('{"a":"x","b":{"a":2,"y":1}}');
  });

  it('handles arrays preserving order', () => {
    expect(stableStringify([3, 1, 2])).toBe('[3,1,2]');
  });

  it('handles null', () => {
    expect(stableStringify(null)).toBe('null');
  });

  it('handles primitives', () => {
    expect(stableStringify(42)).toBe('42');
    expect(stableStringify('hello')).toBe('"hello"');
    expect(stableStringify(true)).toBe('true');
  });

  it('handles empty object', () => {
    expect(stableStringify({})).toBe('{}');
  });

  it('handles empty array', () => {
    expect(stableStringify([])).toBe('[]');
  });

  it('throws on circular reference', () => {
    const obj: Record<string, unknown> = {};
    obj['self'] = obj;
    expect(() => stableStringify(obj)).toThrow('Circular reference detected');
  });

  it('produces same output regardless of key insertion order', () => {
    const a = stableStringify({ licenseKey: 'QAA-A', tier: 'PRO', isFounder: false });
    const b = stableStringify({ tier: 'PRO', licenseKey: 'QAA-A', isFounder: false });
    expect(a).toBe(b);
  });
});

describe('signPayload / verifyPayload', () => {
  const payload = {
    licenseKey: 'QAA-ABCD-1234-EFGH-5678',
    tier: 'PRO' as const,
    isFounder: false,
    issued: '2026-01-01T00:00:00.000Z',
  };

  it('round-trips: sign then verify returns true', () => {
    const sig = signPayload(payload, privateKey);
    expect(verifyPayload(payload, sig, publicKey)).toBe(true);
  });

  it('rejects tampered payload (different tier)', () => {
    const sig = signPayload(payload, privateKey);
    expect(verifyPayload({ ...payload, tier: 'FREE' }, sig, publicKey)).toBe(false);
  });

  it('rejects tampered payload (different key)', () => {
    const sig = signPayload(payload, privateKey);
    expect(verifyPayload({ ...payload, licenseKey: 'QAA-XXXX-XXXX-XXXX-XXXX' }, sig, publicKey)).toBe(
      false,
    );
  });

  it('rejects corrupted signature', () => {
    const sig = signPayload(payload, privateKey);
    const corrupted = sig.slice(0, -4) + 'XXXX';
    expect(verifyPayload(payload, corrupted, publicKey)).toBe(false);
  });

  it('rejects wrong public key', () => {
    const { publicKey: otherPub } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    const sig = signPayload(payload, privateKey);
    expect(verifyPayload(payload, sig, otherPub)).toBe(false);
  });

  it('signature is deterministic for same input', () => {
    expect(signPayload(payload, privateKey)).toBe(signPayload(payload, privateKey));
  });

  it('key ordering does not affect verification (stableStringify)', () => {
    const reordered = {
      tier: 'PRO' as const,
      licenseKey: 'QAA-ABCD-1234-EFGH-5678',
      isFounder: false,
      issued: '2026-01-01T00:00:00.000Z',
    };
    const sig = signPayload(payload, privateKey);
    expect(verifyPayload(reordered, sig, publicKey)).toBe(true);
  });

  it('returns false on garbage public key (no throw)', () => {
    const sig = signPayload(payload, privateKey);
    expect(verifyPayload(payload, sig, 'not-a-key')).toBe(false);
  });
});

describe('computeHash', () => {
  it('returns 64-char hex', () => {
    const hash = computeHash('hello');
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('is deterministic', () => {
    expect(computeHash('test')).toBe(computeHash('test'));
  });

  it('changes for different inputs', () => {
    expect(computeHash('a')).not.toBe(computeHash('b'));
  });
});

describe('timingSafeStringEqual', () => {
  it('returns true for identical strings', () => {
    expect(timingSafeStringEqual('hello', 'hello')).toBe(true);
  });

  it('returns false for different strings of same length', () => {
    expect(timingSafeStringEqual('hello', 'world')).toBe(false);
  });

  it('returns false for different lengths', () => {
    expect(timingSafeStringEqual('hi', 'hello')).toBe(false);
  });

  it('returns true for empty strings', () => {
    expect(timingSafeStringEqual('', '')).toBe(true);
  });

  it('handles utf-8 strings byte-by-byte', () => {
    expect(timingSafeStringEqual('café', 'café')).toBe(true);
    expect(timingSafeStringEqual('café', 'cafe')).toBe(false);
  });
});
