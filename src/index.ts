// Crypto primitives
export {
  stableStringify,
  signPayload,
  verifyPayload,
  computeHash,
  timingSafeStringEqual,
} from './signing.js';

// Payload construction
export { normalizeEmail, hashEmail, buildLicensePayload } from './payload.js';

// Registry construction
export { buildSignedRegistry } from './registry.js';

// Validation helpers (pure — no I/O)
export { validateRegistryEntry, verifyRegistryMetadata } from './validator.js';
export type { ValidatedEntry, ValidationFailure, ValidationResult } from './validator.js';

// License key format
export { licenseKeyPattern, isValidLicenseKey, normalizeLicenseKey } from './key-format.js';

// Types
export type {
  Tier,
  LicensePayload,
  RegistryEntry,
  Registry,
  RegistryMetadata,
  SignedRegistry,
} from './types.js';
