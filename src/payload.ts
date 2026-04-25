/**
 * Email normalization, hashing, and license payload construction.
 *
 * buildLicensePayload is the contract the fulfillment service signs against
 * and that every client must rebuild bit-for-bit before verification. Adding
 * fields here = breaking change.
 */

import { createHash } from 'crypto';
import type { LicensePayload, Tier } from './types.js';

export function normalizeEmail(email: string): string | null {
  if (!email || typeof email !== 'string') return null;
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return null;
  return normalized.length > 0 ? normalized : null;
}

export function hashEmail(email: string): string | null {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  return createHash('sha256').update(normalized).digest('hex');
}

export function buildLicensePayload(opts: {
  licenseKey: string;
  tier: Tier;
  isFounder: boolean;
  issued: string;
  emailHash?: string | null;
}): LicensePayload {
  if (!opts.licenseKey || typeof opts.licenseKey !== 'string') {
    throw new Error('licenseKey is required and must be a string');
  }
  if (!opts.tier || typeof opts.tier !== 'string') {
    throw new Error('tier is required and must be a string');
  }
  if (!opts.issued || typeof opts.issued !== 'string') {
    throw new Error('issued is required and must be a string');
  }

  const payload: LicensePayload = {
    licenseKey: opts.licenseKey,
    tier: opts.tier,
    isFounder: Boolean(opts.isFounder),
    issued: opts.issued,
  };
  if (opts.emailHash) {
    payload.emailHash = opts.emailHash;
  }
  return payload;
}
