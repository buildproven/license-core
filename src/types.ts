/**
 * Core types for license payloads.
 *
 * IMPORTANT: changing the shape of LicensePayload or RegistryEntry
 * breaks signature verification across every product in the field.
 * Treat these as a frozen contract — bump schemaVersion + ship a new
 * major instead of mutating.
 */

export type Tier = 'FREE' | 'PRO';

/**
 * The payload that is RSA-signed for each license entry.
 * Field set is FROZEN — see comment above.
 */
export interface LicensePayload {
  licenseKey: string;
  tier: Tier;
  isFounder: boolean;
  issued: string;
  /** Optional — only included when emailHash is non-null on the entry. */
  emailHash?: string;
}

/**
 * One row in the signed registry.
 * Stored in Vercel KV by the fulfillment service, fetched + verified by clients.
 */
export interface RegistryEntry {
  tier: Tier;
  isFounder: boolean;
  issued: string;
  emailHash: string | null;
  /** RSA-SHA256 base64 signature of the LicensePayload above. */
  signature: string;
  customerId: string;
  /** Identifies which keypair signed this entry — for rotation. */
  keyId: string;
}

export type Registry = Record<string, RegistryEntry>;

export interface RegistryMetadata {
  version: string;
  created: string;
  lastUpdate: string;
  description: string;
  algorithm: string;
  keyId: string;
  /** RSA-SHA256 base64 signature over the entries (metadata excluded). */
  registrySignature: string;
  /** SHA-256 hex of stableStringify(entries). */
  hash: string;
  totalLicenses: number;
}

export interface SignedRegistry {
  _metadata: RegistryMetadata;
  [licenseKey: string]: RegistryEntry | RegistryMetadata;
}
