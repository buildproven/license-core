# license-core - Claude Guide

> Shared license signing/verification primitives. Single source of truth.

## Frozen contract — DO NOT mutate

The shape of `LicensePayload` and `RegistryEntry` is **frozen for the v1.x line**. Consumers in the wild rebuild these payloads to verify signatures. Any field set drift = silent verification failure for shipped customers.

To add a field: bump major, ship as a new package name. The 1.x line is the contract forever.

## Tests

`npm test` runs the full suite. The optional **golden-vector test** verifies byte-for-byte parity with QA Architect's deployed `lib/license-signing.js`. To enable it, set the `QAA_SIGNING_PATH` env var to that file's absolute path before running tests; otherwise it's skipped.

## Publish

Published to public npm as `@buildproven/license-core`. Releases via tag push (`v*.*.*`) → GitHub Actions workflow → npm Trusted Publishing (OIDC, no token).

## Repo

`github.com/buildproven/license-core`
