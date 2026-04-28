# `@buildproven/license-core`

[![npm version](https://img.shields.io/npm/v/@buildproven/license-core.svg)](https://www.npmjs.com/package/@buildproven/license-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Tiny, frozen-contract license signing & verification primitives. Deterministic JSON, RSA-SHA256, signed registry. Use it to issue and verify software licenses without running a license server on the hot path — clients fetch a signed JSON registry, verify it locally with a bundled public key, and decide.

```
npm install @buildproven/license-core
```

## Why this exists

If you're shipping a desktop app, CLI tool, or developer plugin and want to sell licenses, you need:

1. A way to **sign** a license entry on your server (when a customer pays)
2. A way for the **client** to verify that signature locally — without making a network call on every launch

That's what this is. ~14 functions, no runtime dependencies. Sign on the server, distribute a signed registry as a static JSON file, verify on the client. Works offline, no license server to keep alive, no per-call latency.

## Quick example

### Server side (when a customer purchases)

```ts
import {
  buildLicensePayload,
  buildSignedRegistry,
  hashEmail,
  signPayload,
  type Registry,
} from '@buildproven/license-core';

const PRIVATE_KEY = process.env.LICENSE_PRIVATE_KEY!; // PEM, RSA 2048+

const issued = new Date().toISOString();
const payload = buildLicensePayload({
  licenseKey: 'MYAPP-A1B2-C3D4-E5F6-7890',
  tier: 'PRO',
  isFounder: false,
  issued,
  emailHash: hashEmail('customer@example.com') ?? undefined,
});

const entry = {
  tier: 'PRO' as const,
  isFounder: false,
  issued,
  emailHash: hashEmail('customer@example.com'),
  signature: signPayload(payload, PRIVATE_KEY),
  customerId: 'cus_abc123',
  keyId: 'default',
};

const registry: Registry = { 'MYAPP-A1B2-C3D4-E5F6-7890': entry };
const signedRegistry = buildSignedRegistry(registry, PRIVATE_KEY);

// Serve `signedRegistry` as JSON at e.g. https://yoursite.com/api/licenses.json
```

### Client side (when the user starts your app)

```ts
import {
  validateRegistryEntry,
  verifyRegistryMetadata,
  hashEmail,
  isValidLicenseKey,
} from '@buildproven/license-core';

const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
...
-----END PUBLIC KEY-----`; // bundled with your app

const userKey = process.env.MYAPP_LICENSE_KEY ?? '';
const userEmail = '...'; // from your activation flow

if (!isValidLicenseKey(userKey, 'MYAPP')) {
  throw new Error('Bad key format');
}

const res = await fetch('https://yoursite.com/api/licenses.json');
const signedRegistry = await res.json();

const entries = verifyRegistryMetadata(signedRegistry, PUBLIC_KEY); // throws on tampering
const entry = entries[userKey.toUpperCase()];
if (!entry) throw new Error('License not found');

const result = validateRegistryEntry({
  licenseKey: userKey.toUpperCase(),
  entry,
  publicKeyPem: PUBLIC_KEY,
  userEmailHash: hashEmail(userEmail) ?? undefined,
});

if (!result.valid) throw new Error(result.error);

console.log(`Licensed: ${result.tier}, Founder: ${result.isFounder}`);
```

## API reference

### Crypto primitives

- `stableStringify(value)` — deterministic JSON stringify (sorted keys, circular-ref detection)
- `signPayload(payload, privateKeyPem)` — RSA-SHA256 sign, returns base64
- `verifyPayload(payload, signature, publicKeyPem)` — RSA-SHA256 verify, returns boolean
- `computeHash(data)` — SHA-256 hex
- `timingSafeStringEqual(a, b)` — constant-time string comparison

### Payload construction

- `normalizeEmail(email)` — trim + lowercase + format-validate, or `null`
- `hashEmail(email)` — SHA-256 hex of normalized email, or `null`
- `buildLicensePayload({ licenseKey, tier, isFounder, issued, emailHash? })` — the **frozen** payload shape

### Registry

- `buildSignedRegistry(entries, privateKeyPem, keyId?)` — wraps entries with `_metadata` containing the registry signature and hash

### Validation helpers (pure — no I/O)

- `validateRegistryEntry({ licenseKey, entry, publicKeyPem, userEmailHash? })` — verifies one entry's signature and optional email match
- `verifyRegistryMetadata(signedRegistry, publicKeyPem)` — verifies the registry-level signature and hash, returns extracted entries (throws on failure)

### Key format

- `licenseKeyPattern(prefix)` — RegExp for `PREFIX-XXXX-XXXX-XXXX-XXXX`
- `isValidLicenseKey(key, prefix)` — boolean
- `normalizeLicenseKey(key)` — trim + uppercase

### Types

`Tier`, `LicensePayload`, `RegistryEntry`, `Registry`, `RegistryMetadata`, `SignedRegistry`, `ValidatedEntry`, `ValidationFailure`, `ValidationResult`

## Frozen contract

The shape of `LicensePayload` and `RegistryEntry` is **frozen for the entire `1.x` line**. Shipped clients in the field rebuild these payloads from registry entries to verify signatures — adding a field would silently break verification for every existing customer.

To evolve the schema: bump major and ship as a new package name. The 1.x line is the contract for already-deployed clients.

## How keys work

You generate one RSA-2048 keypair per product:

```bash
openssl genpkey -algorithm RSA -out private.pem -pkeyopt rsa_keygen_bits:2048
openssl rsa -in private.pem -pubout -out public.pem
```

- **Private key** lives in your fulfillment server's env vars. It signs license entries.
- **Public key** is bundled with your client. It verifies signatures.

The package never handles key generation, storage, or rotation — that's your call. Use whatever secret manager you already have.

## Publishing your own fork (Trusted Publishing setup)

If you fork this and want to publish under your own scope via npm Trusted Publishing (no `NPM_TOKEN`), there's one gotcha worth documenting because it cost an hour during the initial release here:

**Don't pass `registry-url` to `actions/setup-node`.** It auto-generates an `.npmrc` with a placeholder `${NODE_AUTH_TOKEN}` value, which makes `npm publish` authenticate via that fake token instead of falling through to OIDC. Result: a `404 Not Found` from the registry that looks like a misconfigured trusted publisher.

The minimal working workflow:

```yaml
name: Publish to npm
on:
  push:
    tags: ['v*.*.*']

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write   # required for OIDC
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          # NO registry-url here — it would inject a fake NODE_AUTH_TOKEN
      - run: npm install -g npm@latest    # need >=11.5.1 for Trusted Publishing
      - run: npm ci
      - run: npm test
      - run: npm publish --access public --provenance
```

On the npm side, configure the trusted publisher under your package's settings page after the package exists (chicken-and-egg: do the *first* publish via a granular access token, then switch to OIDC for everything after).

## License

[MIT](./LICENSE) © Vibe Build Lab LLC

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). The `1.x` line has a frozen contract; most contributions should be bug fixes, doc improvements, or test coverage.

## Security

See [SECURITY.md](./SECURITY.md) for the threat model and how to report vulnerabilities.
