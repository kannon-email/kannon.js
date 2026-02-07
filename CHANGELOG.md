# Changelog

## v1.0.1

### Bug Fixes

- Export `Recipient` type from main entry point to allow proper TypeScript imports

Previously, the `Recipient` type was defined but not exported, making it impossible to import it directly from the package:
```ts
// Now works correctly
import { type Recipient } from 'kannon.js';
```

---

## v1.0.0

### Overview

This is the v1.0.0 release of kannon.js, the official Node.js client library for Kannon Email Sender. This release includes significant infrastructure improvements, new features, and breaking changes.

**Comparison**: v0.5.0 (June 26, 2024) → v1.0.0

---

### Breaking Changes

#### Migration from ts-proto to Connect-RPC and Buf (#3)

The library now uses Connect-RPC and Buf for gRPC communication instead of ts-proto.

**Configuration Change Required:**

| Old (v0.5.0) | New (v1.0.0) |
|--------------|--------------|
| `{ host: 'api.kannon.dev:443' }` | `{ endpoint: 'https://api.kannon.dev' }` |

- **Protocol required**: You must now specify `https://` or `http://`
- **Parameter renamed**: `host` → `endpoint`
- **TLS handling**: `skipTLS` option is no longer supported
- **Port optional**: Standard ports (443/80) are automatically used

---

### New Features

#### To and CC Headers Support (#7)

Added support for To and CC email headers, enabling proper email threading and visibility:

```ts
await kannon.sendHtml(
  ['primary@example.com'],
  'Project Update',
  '<h1>Update</h1>',
  {
    headers: {
      to: ['team@example.com'],
      cc: ['manager@example.com', 'stakeholders@example.com'],
    },
  },
);
```

#### Mail Sender API (#8)

Added a simplified `MailSender` class for sending emails without templating. Provides a traditional mail API with To, CC, BCC support and attachments:

```ts
import { KannonCli, MailSender } from 'kannon.js';

const client = new KannonCli(domain, apiKey, sender, config);
const mailSender = new MailSender(client);

await mailSender.send({
  to: ['alice@example.com', 'bob@example.com'],
  cc: 'manager@example.com',
  bcc: 'archive@example.com',
  subject: 'Monthly Report',
  content: '<h1>Report</h1><p>See attachment.</p>',
  attachments: [
    { filename: 'report.pdf', content: pdfBuffer },
  ],
});
```

---

### Infrastructure & Developer Experience

#### Testing Framework (#4)
- Added Vitest testing framework with UI and coverage support
- Includes test scripts: `test`, `test:ui`, `test:run`, `test:coverage`

#### CI/CD Pipeline (#5)
- Added GitHub Actions CI workflow
- Improved project scripts and dependency management

#### Migration to Biome (#6)
- Migrated from ESLint/Prettier to Biome for linting and formatting
- Updated all dependencies to latest versions

---

### Documentation

- Fixed typos in README.md (#2)
- Updated documentation for new endpoint configuration format
- Added comprehensive usage examples for headers feature

---

### Dependencies

#### Production
- `@bufbuild/protobuf`: ^2.11.0
- `@connectrpc/connect`: ^2.1.1
- `@connectrpc/connect-node`: ^2.1.1

#### Development
- `@biomejs/biome`: 2.3.12
- `@bufbuild/buf`: ^1.64.0
- `vitest`: ^4.0.18
- `husky`: ^9.1.7

---

### Migration Guide

1. Update endpoint configuration to include protocol:
   ```ts
   // Before
   { host: 'api.kannon.dev:443' }

   // After
   { endpoint: 'https://api.kannon.dev' }
   ```

2. Update your imports (no changes required)

3. Test your integration to ensure compatibility

---

### Full Changelog

- `a45e4c6` docs: Review some typos in README.md (#2)
- `b2f9aff` feat: migrate to Connect-RPC and Buf, update project structure and dependencies (#3)
- `98e694d` feat: setup tests (#4)
- `e3db7c9` chore: add ci workflow, update dependencies, and improve project scripts (#5)
- `68da571` chore: upgrade deps and migrate to biome (#6)
- `c7766a4` feat: implement to and cc headers (#7)
- `685fabe` feat: add mailsender api (#8)
