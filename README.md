# @buildproven/license-core

Shared license signing & verification primitives for BuildProven products.

## What this is

A tiny, frozen-contract package that does one thing: deterministic stringify + RSA-SHA256 sign/verify so that every BuildProven product (QA Architect, claude-kit-pro, future products) can validate licenses against the same byte-for-byte format.

Used by:

- `buildproven-fulfillment` (Vercel) — signs entries, builds signed registries
- `qa-architect` (npm CLI) — verifies fetched registry against bundled public key
- `claude-kit-pro` (Claude Code MCP plugin) — same

## Why it exists

Before this package, the same crypto code lived in 3 places. Any drift broke signature verification across the product/server boundary. Now there's one source of truth.

## API

```ts
import {
  // Crypto primitives
  stableStringify,
  signPayload,
  verifyPayload,
  computeHash,
  timingSafeStringEqual,

  // Payload construction
  normalizeEmail,
  hashEmail,
  buildLicensePayload,

  // Registry
  buildSignedRegistry,

  // Validation helpers (pure — no I/O)
  validateRegistryEntry,
  verifyRegistryMetadata,

  // Key format
  licenseKeyPattern,
  isValidLicenseKey,
  normalizeLicenseKey,
} from '@buildproven/license-core';
```

## Frozen contract

The shape of `LicensePayload` and `RegistryEntry` is **frozen** for the v1.x line. Adding fields is a breaking change because shipped customer CLIs reconstruct payloads from registry entries to verify signatures — any field set drift causes silent verification failure.

If you need a new field, bump the major and ship as a new package name (`@buildproven/license-core-v2`). The 1.x line continues to be the contract for QA Architect's deployed customers.

## Install

```bash
npm install @buildproven/license-core
```

## Develop

```bash
npm install
npm test       # vitest, includes golden-vector test against QAA's deployed code
npm run build  # tsup → dist/
```

## License

MIT
