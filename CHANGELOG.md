# Changelog

All notable changes to `@buildproven/license-core` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2026-04-27

### Added

- README sections for **recurring billing & subscriptions** (closes BUI-255), **key rotation playbook** (closes BUI-259), and **Trusted Publishing setup gotchas** (closes BUI-258).
- Property-based tests for `stableStringify` using fast-check — 5 invariants × 500 randomized inputs each, plus explicit edge cases for unicode, deep nesting, empty keys, escaping, and integer-string keys (closes BUI-262).

### Changed

- CI test runtime bumped from Node 20 → Node 22 LTS (closes BUI-256, partial — runner-host deprecation tracked separately).

## [1.0.1] - 2026-04-27

### Changed

- OSS-readiness scrub: removed `BuildProven`-specific strings from public surface (registry `_metadata.description`, type doc comments). Wire format unchanged; signatures from 1.0.0 still verify.
- Added `CHANGELOG.md`, `SECURITY.md`, `CONTRIBUTING.md`.
- Made golden-vector test path configurable via `QAA_SIGNING_PATH` env var instead of hard-coded.

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
