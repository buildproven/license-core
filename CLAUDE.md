# buildproven-license-core - Claude Guide

> Shared license signing/verification primitives for BuildProven products.

## What this is

Single source of truth for license crypto. Used by `buildproven-fulfillment` (server), `qa-architect` (npm CLI), and `claude-kit-pro` (MCP plugin).

## Frozen contract — DO NOT mutate

The shape of `LicensePayload` and `RegistryEntry` is **frozen for the v1.x line**. Customer CLIs in the wild rebuild these payloads to verify signatures. Any field set drift = silent verification failure for shipped customers.

To add a field: bump major, ship as a new package name. The 1.x line is the QAA contract forever.

## Tests

`npm test` runs the full suite, including the **golden-vector test** that imports `~/Projects/products/qa-architect/lib/license-signing.js` directly and asserts byte-for-byte parity. CI must clone qa-architect alongside or those tests skip.

## Publish

GitHub Packages, scope `@buildproven`. `npm publish` is gated by `prepublishOnly` running build + tests.
