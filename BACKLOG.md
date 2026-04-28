# Backlog

## 🔥 High Value — Subscription support (v2.x)

| ID | Item | Why | Effort | Status |
|----|------|-----|--------|--------|
| SUB-1 | Add `expiresAt` to `LicensePayload` (v2 schema) | Subscriptions can't ship safely on v1.x — `expiresAt` requires new payload field, which is a frozen-contract break. v2.x line. | M | Backlog |
| SUB-2 | `validateRegistryEntry` checks expiry | Once SUB-1 lands, gate validity on expiry timestamp. Optional `now` param for testability. | S | Blocked by SUB-1 |
| SUB-3 | Optional revocation list helper | Sign + verify a separate `revoked.json` so cancellations propagate without re-issuing every entry. | M | Backlog |
| SUB-4 | Client refresh strategy doc | "How to wire up periodic registry refresh" — cookbook in README for monthly/annual SaaS. | S | Backlog |

## 📊 Medium Value

| ID | Item | Why | Effort | Status |
|----|------|-----|--------|--------|
| OPS-1 | Bump GitHub Actions to Node.js 24 (deprecation Sep 2026) | Workflow currently throws warnings on every run. | XS | Backlog |
| DOC-1 | Add minimal example repo (`license-core-example`) showing fulfillment + client wired up end-to-end | Lowers adoption friction; great content asset. | M | Backlog |
| DOC-2 | "Trusted Publishing setup" how-to in README | The setup-node + NPM_TOKEN gotcha cost an hour of debugging. Worth documenting for OSS users. | XS | Backlog |
| KEY-1 | Document key rotation playbook (per-product `keyId`) | Already supported via `buildSignedRegistry(entries, key, keyId)`, but no docs explain the migration path. | S | Backlog |

## 📚 Low Value / Nice-to-have

| ID | Item | Why | Effort | Status |
|----|------|-----|--------|--------|
| EXT-1 | Web Crypto (browser/edge) build target | Currently Node-only via `crypto`. Cloudflare Workers / Edge functions need Web Crypto. Would unlock more deployment targets. | L | Backlog |
| EXT-2 | Ed25519 signing alongside RSA-SHA256 | Smaller signatures, faster verify. Would be a `algorithm` field per entry. | M | Backlog |
| TEST-1 | Property-based tests for `stableStringify` | fast-check / hypothesis-style fuzz to lock in determinism across edge cases (BigInt, sparse arrays, unicode). | M | Backlog |

## Completed ✅

| ID | Feature | Completed |
|----|---------|-----------|
| - | v1.0.0 published to npm | 2026-04-25 |
| - | OSS scrub (CHANGELOG, SECURITY, CONTRIBUTING, README rewrite, brand removal) | 2026-04-27 |
| - | OIDC Trusted Publishing via GitHub Actions | 2026-04-27 |
| - | v1.0.1 published with provenance | 2026-04-27 |
| - | Three downstream consumers on registry version (^1.0.1) | 2026-04-27 |

---

**Frozen contract reminder:** anything that changes the shape of `LicensePayload` or `RegistryEntry` is a v2.x change shipped under a new package name. Do not mutate v1.x.

**Effort:** XS (<1h) | S (<4h) | M (4-16h) | L (16-40h) | XL (40h+)
