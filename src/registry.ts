/**
 * Build a complete signed registry from a flat entries map.
 *
 * The registry signature covers ONLY the entries — _metadata is excluded.
 * QAA's deployed validator destructures `_metadata` out before verifying,
 * so any change to what's signed will break compatibility.
 */

import { computeHash, signPayload, stableStringify } from './signing.js';
import type { Registry, SignedRegistry } from './types.js';

export function buildSignedRegistry(
  entries: Registry,
  privateKeyPem: string,
  keyId = 'default',
): SignedRegistry {
  const now = new Date().toISOString();
  const entriesStr = stableStringify(entries);
  const registrySignature = signPayload(entries, privateKeyPem);
  const hash = computeHash(entriesStr);

  return {
    _metadata: {
      version: '1.0',
      created: now,
      lastUpdate: now,
      description: 'BuildProven license registry — populated by fulfillment webhook',
      algorithm: 'rsa-sha256',
      keyId,
      registrySignature,
      hash,
      totalLicenses: Object.keys(entries).length,
    },
    ...entries,
  };
}
