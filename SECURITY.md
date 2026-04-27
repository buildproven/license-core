# Security policy

## Reporting a vulnerability

Please email **security@buildproven.ai** with the details. Do not open a public GitHub issue for security reports.

We will acknowledge within 72 hours and aim to provide a patch within 14 days for confirmed vulnerabilities. We will credit reporters in the changelog unless they prefer to remain anonymous.

## Supported versions

The `1.x` line is the supported, frozen-contract release. Security patches will be backported to the latest `1.x` until a `2.x` line is released.

## Threat model

This package implements RSA-SHA256 signing and verification primitives for license registries. The security guarantees rest on:

- **Private key custody** — the registry signer must keep its RSA private key secret. Compromise of the private key allows an attacker to forge any license entry.
- **Public key distribution** — clients must bundle the public key from a trusted source. If an attacker can substitute the public key on a client install, they can forge licenses.
- **Deterministic stringify** — `stableStringify` must produce byte-identical output across versions. Changes to it would break verification of licenses signed by older versions.

The package itself does not handle key generation, key storage, network fetching, or local persistence — those are the consumer's responsibility.

## Known non-issues

- **The package is open source** — this is intentional. Security is provided by the private RSA key (held by the registry signer), not by hiding the verification algorithm.
- **`hashEmail` is a plain SHA-256 of normalized email** — this is for license-to-email binding, not credential storage. Do not reuse this primitive for password storage.
