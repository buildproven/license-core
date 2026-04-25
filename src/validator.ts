/**
 * Pure validation helpers — no I/O, no caching, no env.
 *
 * Both QA Architect's CLI and claude-kit-pro's MCP server use these
 * to verify a registry response. Anything that touches disk, network,
 * or process.env stays in the consuming product. This is the seam
 * that prevents the two validators from drifting apart.
 */

import { buildLicensePayload } from './payload.js';
import { computeHash, stableStringify, timingSafeStringEqual, verifyPayload } from './signing.js';
import type { RegistryEntry, SignedRegistry } from './types.js';

export interface ValidatedEntry {
  valid: true;
  tier: RegistryEntry['tier'];
  isFounder: boolean;
  customerId: string;
  keyId: string;
}

export interface ValidationFailure {
  valid: false;
  error: string;
}

export type ValidationResult = ValidatedEntry | ValidationFailure;

/**
 * Verify a single registry entry against its embedded signature.
 * Optionally check the user's email hash against the entry's emailHash.
 *
 * Mirrors QAA's validateLicense() field-set exactly:
 *   payload = { licenseKey, tier, isFounder, issued, emailHash? }
 */
export function validateRegistryEntry(opts: {
  licenseKey: string;
  entry: RegistryEntry;
  publicKeyPem: string;
  /** If supplied, must match entry.emailHash (timing-safe). */
  userEmailHash?: string;
}): ValidationResult {
  const { licenseKey, entry, publicKeyPem, userEmailHash } = opts;

  if (entry.emailHash && userEmailHash && !timingSafeStringEqual(userEmailHash, entry.emailHash)) {
    return { valid: false, error: 'Email address does not match license registration' };
  }

  const payload = buildLicensePayload({
    licenseKey,
    tier: entry.tier,
    isFounder: entry.isFounder,
    issued: entry.issued,
    emailHash: entry.emailHash,
  });

  if (!verifyPayload(payload, entry.signature, publicKeyPem)) {
    return { valid: false, error: 'License entry signature verification failed' };
  }

  return {
    valid: true,
    tier: entry.tier,
    isFounder: entry.isFounder,
    customerId: entry.customerId,
    keyId: entry.keyId,
  };
}

/**
 * Verify a complete signed registry: registry-level signature + hash check.
 * Returns the entries map (with _metadata stripped) on success, throws on failure.
 *
 * Throws (rather than returning a result) because a registry signature failure
 * should halt validation entirely — clients should not fall back to entries
 * from an unverified registry.
 */
export function verifyRegistryMetadata(
  signedRegistry: SignedRegistry,
  publicKeyPem: string,
): Record<string, RegistryEntry> {
  const { _metadata, ...entries } = signedRegistry;

  if (!_metadata?.registrySignature) {
    throw new Error('Registry missing _metadata.registrySignature');
  }

  if (!verifyPayload(entries, _metadata.registrySignature, publicKeyPem)) {
    throw new Error('Registry signature verification failed');
  }

  if (_metadata.hash) {
    const computed = computeHash(stableStringify(entries));
    if (!timingSafeStringEqual(computed, _metadata.hash)) {
      throw new Error('Registry hash mismatch');
    }
  }

  return entries as Record<string, RegistryEntry>;
}
