import { describe, it, expect } from 'vitest';
import { generateKeyPairSync } from 'crypto';
import {
  validateRegistryEntry,
  verifyRegistryMetadata,
} from '../src/validator.js';
import { buildSignedRegistry } from '../src/registry.js';
import { signPayload } from '../src/signing.js';
import { buildLicensePayload, hashEmail } from '../src/payload.js';
import type { Registry, RegistryEntry } from '../src/types.js';

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

const { privateKey: otherPriv, publicKey: otherPub } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

function makeEntry(opts: {
  licenseKey: string;
  email?: string;
  tier?: 'PRO' | 'FREE';
  isFounder?: boolean;
}): RegistryEntry {
  const issued = '2026-04-24T00:00:00.000Z';
  const tier = opts.tier ?? 'PRO';
  const isFounder = opts.isFounder ?? false;
  const emailHash = opts.email ? hashEmail(opts.email) : null;
  const payload = buildLicensePayload({
    licenseKey: opts.licenseKey,
    tier,
    isFounder,
    issued,
    emailHash: emailHash ?? undefined,
  });
  return {
    tier,
    isFounder,
    issued,
    emailHash,
    signature: signPayload(payload, privateKey),
    customerId: 'cus_test',
    keyId: 'default',
  };
}

describe('validateRegistryEntry', () => {
  it('accepts a valid entry with no email', () => {
    const licenseKey = 'QAA-ABCD-1234-EFGH-5678';
    const entry = makeEntry({ licenseKey });
    const result = validateRegistryEntry({ licenseKey, entry, publicKeyPem: publicKey });
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.tier).toBe('PRO');
  });

  it('accepts a valid entry with matching email', () => {
    const licenseKey = 'QAA-ABCD-1234-EFGH-5678';
    const email = 'user@example.com';
    const entry = makeEntry({ licenseKey, email });
    const result = validateRegistryEntry({
      licenseKey,
      entry,
      publicKeyPem: publicKey,
      userEmailHash: hashEmail(email)!,
    });
    expect(result.valid).toBe(true);
  });

  it('rejects entry when user email does not match', () => {
    const licenseKey = 'QAA-ABCD-1234-EFGH-5678';
    const entry = makeEntry({ licenseKey, email: 'user@example.com' });
    const result = validateRegistryEntry({
      licenseKey,
      entry,
      publicKeyPem: publicKey,
      userEmailHash: hashEmail('imposter@example.com')!,
    });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toMatch(/email/i);
  });

  it('rejects when signed with a different key', () => {
    const licenseKey = 'QAA-ABCD-1234-EFGH-5678';
    const entry = makeEntry({ licenseKey });
    const result = validateRegistryEntry({ licenseKey, entry, publicKeyPem: otherPub });
    expect(result.valid).toBe(false);
  });

  it('rejects tampered tier', () => {
    const licenseKey = 'QAA-ABCD-1234-EFGH-5678';
    const entry = { ...makeEntry({ licenseKey, tier: 'FREE' }), tier: 'PRO' as const };
    const result = validateRegistryEntry({ licenseKey, entry, publicKeyPem: publicKey });
    expect(result.valid).toBe(false);
  });

  it('rejects tampered isFounder', () => {
    const licenseKey = 'QAA-ABCD-1234-EFGH-5678';
    const entry = { ...makeEntry({ licenseKey, isFounder: false }), isFounder: true };
    const result = validateRegistryEntry({ licenseKey, entry, publicKeyPem: publicKey });
    expect(result.valid).toBe(false);
  });

  it('skips email check when entry has no emailHash', () => {
    const licenseKey = 'QAA-ABCD-1234-EFGH-5678';
    const entry = makeEntry({ licenseKey });
    const result = validateRegistryEntry({
      licenseKey,
      entry,
      publicKeyPem: publicKey,
      userEmailHash: hashEmail('whatever@example.com')!,
    });
    expect(result.valid).toBe(true);
  });

  it('rejects when signature is corrupted', () => {
    const licenseKey = 'QAA-ABCD-1234-EFGH-5678';
    const entry = makeEntry({ licenseKey });
    const corrupted = { ...entry, signature: entry.signature.slice(0, -4) + 'XXXX' };
    const result = validateRegistryEntry({ licenseKey, entry: corrupted, publicKeyPem: publicKey });
    expect(result.valid).toBe(false);
  });
});

describe('verifyRegistryMetadata', () => {
  const licenseKey = 'QAA-ABCD-1234-EFGH-5678';
  const entries: Registry = {
    [licenseKey]: makeEntry({ licenseKey, email: 'user@example.com' }),
  };

  it('returns entries when registry signature is valid', () => {
    const signed = buildSignedRegistry(entries, privateKey);
    const extracted = verifyRegistryMetadata(signed, publicKey);
    expect(extracted[licenseKey]).toBeDefined();
    expect(extracted['_metadata' as never]).toBeUndefined();
  });

  it('throws on missing _metadata.registrySignature', () => {
    const signed = buildSignedRegistry(entries, privateKey);
    const broken = { ...signed, _metadata: { ...signed._metadata, registrySignature: '' } };
    expect(() => verifyRegistryMetadata(broken, publicKey)).toThrow(/missing/i);
  });

  it('throws on invalid registry signature (wrong key)', () => {
    const signed = buildSignedRegistry(entries, privateKey);
    expect(() => verifyRegistryMetadata(signed, otherPub)).toThrow(/signature/i);
  });

  it('throws on tampered hash', () => {
    const signed = buildSignedRegistry(entries, privateKey);
    const tamperedMeta = { ...signed._metadata, hash: 'a'.repeat(64) };
    const broken = { ...signed, _metadata: tamperedMeta };
    expect(() => verifyRegistryMetadata(broken, publicKey)).toThrow(/hash/i);
  });

  it('throws on tampered entry (registry signature fails)', () => {
    const signed = buildSignedRegistry(entries, privateKey);
    const broken = {
      ...signed,
      [licenseKey]: { ...signed[licenseKey], tier: 'FREE' } as RegistryEntry,
    };
    expect(() => verifyRegistryMetadata(broken, publicKey)).toThrow(/signature|hash/i);
  });

  it('handles empty registry', () => {
    const signed = buildSignedRegistry({}, privateKey);
    expect(verifyRegistryMetadata(signed, publicKey)).toEqual({});
  });
});
