import { describe, it, expect } from 'vitest';
import { normalizeEmail, hashEmail, buildLicensePayload } from '../src/payload.js';

describe('normalizeEmail', () => {
  it('lowercases and trims', () => {
    expect(normalizeEmail('  Brett@Example.COM  ')).toBe('brett@example.com');
  });

  it('returns null for missing @', () => {
    expect(normalizeEmail('notanemail')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(normalizeEmail('')).toBeNull();
  });

  it('returns null for missing TLD', () => {
    expect(normalizeEmail('user@nodot')).toBeNull();
  });

  it('accepts normal email', () => {
    expect(normalizeEmail('user@example.com')).toBe('user@example.com');
  });

  it('returns null for whitespace-only local part', () => {
    expect(normalizeEmail(' @example.com')).toBeNull();
  });
});

describe('hashEmail', () => {
  it('produces 64-char hex string', () => {
    const hash = hashEmail('brett@example.com');
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('is case-insensitive (same hash for upper/lower)', () => {
    expect(hashEmail('brett@example.com')).toBe(hashEmail('BRETT@EXAMPLE.COM'));
  });

  it('is trim-insensitive', () => {
    expect(hashEmail('brett@example.com')).toBe(hashEmail('  brett@example.com  '));
  });

  it('returns null for invalid email', () => {
    expect(hashEmail('notanemail')).toBeNull();
  });

  it('different emails produce different hashes', () => {
    expect(hashEmail('a@example.com')).not.toBe(hashEmail('b@example.com'));
  });
});

describe('buildLicensePayload', () => {
  const base = {
    licenseKey: 'QAA-ABCD-1234-EFGH-5678',
    tier: 'PRO' as const,
    isFounder: false,
    issued: '2026-01-01T00:00:00.000Z',
  };

  it('includes all required fields', () => {
    const payload = buildLicensePayload(base);
    expect(payload).toMatchObject({
      licenseKey: 'QAA-ABCD-1234-EFGH-5678',
      tier: 'PRO',
      isFounder: false,
      issued: '2026-01-01T00:00:00.000Z',
    });
  });

  it('omits emailHash when null', () => {
    const payload = buildLicensePayload({ ...base, emailHash: null });
    expect('emailHash' in payload).toBe(false);
  });

  it('omits emailHash when undefined', () => {
    expect('emailHash' in buildLicensePayload(base)).toBe(false);
  });

  it('includes emailHash when provided', () => {
    const hash = hashEmail('brett@example.com')!;
    const payload = buildLicensePayload({ ...base, emailHash: hash });
    expect(payload.emailHash).toBe(hash);
  });

  it('does not include extra fields beyond the spec', () => {
    const payload = buildLicensePayload(base);
    expect(Object.keys(payload).sort()).toEqual(['isFounder', 'issued', 'licenseKey', 'tier']);
  });

  it('throws on missing licenseKey', () => {
    expect(() => buildLicensePayload({ ...base, licenseKey: '' })).toThrow();
  });

  it('throws on missing tier', () => {
    expect(() => buildLicensePayload({ ...base, tier: '' as never })).toThrow();
  });

  it('throws on missing issued', () => {
    expect(() => buildLicensePayload({ ...base, issued: '' })).toThrow();
  });

  it('coerces isFounder to boolean', () => {
    expect(buildLicensePayload({ ...base, isFounder: 1 as unknown as boolean }).isFounder).toBe(
      true,
    );
    expect(buildLicensePayload({ ...base, isFounder: 0 as unknown as boolean }).isFounder).toBe(
      false,
    );
  });
});
