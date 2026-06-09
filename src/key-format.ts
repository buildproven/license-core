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
  if (typeof key !== 'string') return false;
  return licenseKeyPattern(prefix).test(key.trim().toUpperCase());
}

export function normalizeLicenseKey(key: string): string {
  // Defensive: callers pass keys straight from license files / env / CLI args,
  // any of which can be undefined or non-string for incomplete/corrupt input.
  // Return "" rather than throwing so the caller's validation reports an
  // invalid key instead of a TypeError. (Behavior preserved from qa-architect's
  // original normalizeLicenseKey when this was extracted into the package.)
  if (typeof key !== 'string') return '';
  return key.trim().toUpperCase();
}
