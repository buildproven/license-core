# Contributing to `@buildproven/license-core`

Thanks for your interest. This package has a deliberately tiny surface area and a frozen contract for the `1.x` line — so most contributions are bug fixes, doc improvements, or test coverage.

## Local development

```bash
git clone https://github.com/buildproven/license-core.git
cd license-core
npm install
npm test       # vitest run
npm run build  # tsup → dist/
```

Tests are in `tests/`. The package source is in `src/`. Both must remain typed, no `any`.

## What changes are in scope

- Bug fixes in `src/`
- Performance improvements that don't change observable behavior
- Test coverage for edge cases
- Documentation, examples, type doc comments

## What changes are out of scope (for `1.x`)

- **Adding fields to `LicensePayload` or `RegistryEntry`** — this breaks signature verification for every shipped consumer. See [CHANGELOG.md](./CHANGELOG.md) for the frozen-contract policy.
- Removing or renaming exports
- Changing the algorithm (`crypto.sign(null, ...)` is RSA-SHA256 with PKCS#1 v1.5; this is what's signed in the field)
- Altering `stableStringify` output for any input

If you have a use case that requires one of the above, please open an issue first to discuss whether it warrants a `2.x` line.

## Pull requests

- Run `npm test` and `npm run typecheck` before pushing.
- One concern per PR.
- Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`).

## Releasing (maintainers only)

Releases are automated via tag push:

```bash
npm version patch    # or minor/major
git push --follow-tags
```

The `Publish to npm` workflow runs typecheck + tests + build, then publishes via npm Trusted Publishing (OIDC — no token).
