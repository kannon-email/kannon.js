# Contributing to Kannon.js

Kannon.js is the official Node.js client library for [Kannon](https://github.com/kannon-email/kannon). It talks to the Kannon REST API (`/v1`, described by `api/openapi/v1.yaml` in the Kannon repository) with the built-in `fetch`, and has no runtime dependencies.

## Development setup

Prerequisites: Node.js 22 or later and pnpm (the version is pinned in `package.json`).

```bash
git clone https://github.com/kannon-email/kannon.js.git
cd kannon.js
pnpm install
```

## Scripts

- `pnpm run build`: compile `src/` to `lib/`, with type definitions
- `pnpm run typecheck`: strict TypeScript check
- `pnpm run lint`: Biome checks through [Ultracite](https://www.ultracite.ai/); `pnpm dlx ultracite fix` fixes most issues
- `pnpm run test` / `pnpm run test:run` / `pnpm run test:coverage`: Vitest in watch mode, once, or with coverage

A Husky pre-commit hook formats staged files with Ultracite.

## Project structure

```
src/
├── mod.ts           # Public entry point
├── kannon.ts        # KannonCli: builds and sends REST Batches
├── kannon-error.ts  # KannonError: RFC 9457 Problem Details from the API
├── mail-sender.ts   # MailSender: To/CC/BCC mail API on top of KannonCli
├── recipient.ts     # Recipient type and its wire mapping
└── tracking.ts      # Tracking policy type and its wire mapping
```

Wire types (snake_case JSON) stay internal: the public API exposes camelCase types and maps them in one place.

## Testing

Tests stub `fetch` through the `fetch` option of `KannonConfig` and assert the request sent and the result or error mapped back. Every change to the request or response mapping needs a test.

## Commits and releases

Commits follow [Conventional Commits](https://www.conventionalcommits.org/). release-please opens the release PR from them, and the npm package is published when it is merged. Mark a breaking change with `!` after the type and a `BREAKING CHANGE:` footer.

## Pull requests

Before opening one, make sure `pnpm run typecheck`, `pnpm run lint`, `pnpm run test:run` and `pnpm run build` pass, and update `README.md` when the public API changes.

## License

ISC. By contributing, you agree that your contributions are licensed under the same license.
