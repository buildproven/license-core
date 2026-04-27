# Changelog

All notable changes to `@buildproven/license-core` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-04-25

Initial public release.

### Added

- `stableStringify` — deterministic JSON stringify with sorted keys and circular-reference detection.
- `signPayload` / `verifyPayload` — RSA-SHA256 sign and verify (Node `crypto.sign(null, ...)` / `crypto.verify(null, ...)`).
- `hashEmail` / `normalizeEmail` — SHA-256 of trimmed-lowercased email.
- `buildLicensePayload` — frozen-contract payload builder. Field set: `licenseKey`, `tier`, `isFounder`, `issued`, optional `emailHash`.
- `buildSignedRegistry` — wraps a `Registry` with `_metadata` containing `registrySignature` and `hash`.
- `validateRegistryEntry` / `verifyRegistryMetadata` — pure (no I/O) helpers for clients to verify a fetched registry.
- `licenseKeyPattern` / `isValidLicenseKey` / `normalizeLicenseKey` — per-product key format helpers (factory takes uppercase alphanumeric prefix).
- Dual ESM + CJS builds via `tsup`. Full TypeScript types.

### Frozen contract

The shape of `LicensePayload` and `RegistryEntry` is locked for the entire `1.x` line. Adding a field is a breaking change because shipped client validators rebuild payloads from registry entries to verify signatures. Bump major and ship as a new package name to evolve.
