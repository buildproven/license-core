/**
 * Per-product license key format.
 *
 * QAA-XXXX-XXXX-XXXX-XXXX, CKIT-XXXX-XXXX-XXXX-XXXX, etc.
 * One factory so every product validates the same way.
 */

export function licenseKeyPattern(prefix: string): RegExp {
  if (!/^[A-Z0-9]+$/.test(prefix)) {
    throw new Error(`Prefix must be uppercase alphanumeric: ${prefix}`);
  }
  return new RegExp(`^${prefix}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$`);
}

export function isValidLicenseKey(key: string, prefix: string): boolean {
  return licenseKeyPattern(prefix).test(key.trim().toUpperCase());
}

export function normalizeLicenseKey(key: string): string {
  return key.trim().toUpperCase();
}
