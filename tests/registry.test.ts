import { describe, it, expect } from 'vitest';
import { generateKeyPairSync } from 'crypto';
import { buildSignedRegistry } from '../src/registry.js';
import { computeHash, stableStringify, verifyPayload } from '../src/signing.js';
import { hashEmail } from '../src/payload.js';
import type { Registry, RegistryEntry } from '../src/types.js';

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

const sampleEntry: RegistryEntry = {
  tier: 'PRO',
  isFounder: false,
  issued: '2026-01-01T00:00:00.000Z',
  emailHash: hashEmail('user@example.com'),
  signature: 'placeholder',
  customerId: 'cus_test123',
  keyId: 'default',
};

describe('buildSignedRegistry', () => {
  const entries: Registry = {
    'QAA-ABCD-1234-EFGH-5678': sampleEntry,
  };

  it('includes _metadata with required fields', () => {
    const signed = buildSignedRegistry(entries, privateKey);
    expect(signed._metadata).toMatchObject({
      version: '1.0',
      algorithm: 'rsa-sha256',
      keyId: 'default',
      totalLicenses: 1,
    });
    expect(typeof signed._metadata.registrySignature).toBe('string');
    expect(typeof signed._metadata.hash).toBe('string');
    expect(typeof signed._metadata.created).toBe('string');
  });

  it('includes license entries at top level', () => {
    const signed = buildSignedRegistry(entries, privateKey);
    expect(signed['QAA-ABCD-1234-EFGH-5678']).toMatchObject({
      tier: 'PRO',
      isFounder: false,
      customerId: 'cus_test123',
    });
  });

  it('registrySignature verifies against entries (excluding _metadata)', () => {
    const signed = buildSignedRegistry(entries, privateKey);
    const { _metadata, ...licenses } = signed;
    expect(verifyPayload(licenses, _metadata.registrySignature, publicKey)).toBe(true);
  });

  it('hash matches stableStringify of entries', () => {
    const signed = buildSignedRegistry(entries, privateKey);
    const { _metadata, ...licenses } = signed;
    expect(_metadata.hash).toBe(computeHash(stableStringify(licenses)));
  });

  it('totalLicenses reflects entry count', () => {
    const twoEntries: Registry = {
      'QAA-ABCD-1234-EFGH-5678': sampleEntry,
      'QAA-XXXX-YYYY-ZZZZ-1111': { ...sampleEntry, customerId: 'cus_other' },
    };
    expect(buildSignedRegistry(twoEntries, privateKey)._metadata.totalLicenses).toBe(2);
  });

  it('empty registry is valid', () => {
    const signed = buildSignedRegistry({}, privateKey);
    expect(signed._metadata.totalLicenses).toBe(0);
    const { _metadata, ...licenses } = signed;
    expect(verifyPayload(licenses, _metadata.registrySignature, publicKey)).toBe(true);
  });

  it('tampered entry fails registry signature verification', () => {
    const signed = buildSignedRegistry(entries, privateKey);
    const { _metadata } = signed;
    const tampered = {
      'QAA-ABCD-1234-EFGH-5678': { ...sampleEntry, tier: 'FREE' as const },
    };
    expect(verifyPayload(tampered, _metadata.registrySignature, publicKey)).toBe(false);
  });

  it('accepts custom keyId', () => {
    expect(buildSignedRegistry(entries, privateKey, 'v2')._metadata.keyId).toBe('v2');
  });
});
