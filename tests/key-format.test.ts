import { describe, it, expect } from 'vitest';
import { isValidLicenseKey, licenseKeyPattern, normalizeLicenseKey } from '../src/key-format.js';

describe('licenseKeyPattern', () => {
  it('matches QAA prefix format', () => {
    const re = licenseKeyPattern('QAA');
    expect(re.test('QAA-ABCD-1234-EFGH-5678')).toBe(true);
    expect(re.test('QAA-A-B-C-D')).toBe(false);
    expect(re.test('CKIT-ABCD-1234-EFGH-5678')).toBe(false);
  });

  it('matches CKIT prefix format', () => {
    expect(licenseKeyPattern('CKIT').test('CKIT-ABCD-1234-EFGH-5678')).toBe(true);
  });

  it('rejects lowercase characters in segments', () => {
    expect(licenseKeyPattern('QAA').test('QAA-abcd-1234-EFGH-5678')).toBe(false);
  });

  it('throws on bad prefix', () => {
    expect(() => licenseKeyPattern('qaa')).toThrow();
    expect(() => licenseKeyPattern('QA A')).toThrow();
    expect(() => licenseKeyPattern('')).toThrow();
  });
});

describe('isValidLicenseKey', () => {
  it('normalizes case-insensitively', () => {
    expect(isValidLicenseKey('qaa-abcd-1234-efgh-5678', 'QAA')).toBe(true);
  });

  it('trims whitespace', () => {
    expect(isValidLicenseKey('  QAA-ABCD-1234-EFGH-5678  ', 'QAA')).toBe(true);
  });

  it('rejects wrong prefix', () => {
    expect(isValidLicenseKey('QAA-ABCD-1234-EFGH-5678', 'CKIT')).toBe(false);
  });

  it('rejects malformed key', () => {
    expect(isValidLicenseKey('QAA-ABC-1234-EFGH-5678', 'QAA')).toBe(false);
  });

  it('returns false for non-string input instead of throwing', () => {
    // Keys arrive from license files / env / CLI args — any can be undefined or
    // non-string for incomplete/corrupt input. Must not throw a TypeError.
    expect(isValidLicenseKey(undefined as unknown as string, 'QAA')).toBe(false);
    expect(isValidLicenseKey(null as unknown as string, 'QAA')).toBe(false);
    expect(isValidLicenseKey(123 as unknown as string, 'QAA')).toBe(false);
  });
});

describe('normalizeLicenseKey', () => {
  it('uppercases and trims', () => {
    expect(normalizeLicenseKey('  qaa-abcd-1234-efgh-5678 ')).toBe('QAA-ABCD-1234-EFGH-5678');
  });

  it('returns "" for non-string input instead of throwing', () => {
    expect(normalizeLicenseKey(undefined as unknown as string)).toBe('');
    expect(normalizeLicenseKey(null as unknown as string)).toBe('');
    expect(normalizeLicenseKey(123 as unknown as string)).toBe('');
  });
});
