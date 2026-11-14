# Kannon.js

[![CI](https://github.com/kannon-email/kannon.js/actions/workflows/ci.yml/badge.svg)](https://github.com/kannon-email/kannon.js/actions/workflows/ci.yml)

The official Node.js client library for [Kannon](https://github.com/kannon-email/kannon), the cloud-native email sender. It talks to the Kannon REST API (`/v1`) with the built-in `fetch` and has no runtime dependencies. Requires Node.js 22 or later.

## Installation

```bash
npm install kannon.js
```

## Quick Start

```ts
import { KannonCli } from 'kannon.js';

const kannon = new KannonCli(
  'your-domain.com',
  'your-api-key',
  {
    email: 'sender@your-domain.com', // this should match the domain host
    alias: 'Kannon',
  },
);

// Send a simple HTML email
await kannon.sendHtml(
  ['recipient@example.com'],
  'Welcome to Kannon!',
  '<h1>Hello!</h1><p>Welcome to our platform.</p>',
);
```

## MailSender - Simple Email API

For straightforward email sending without templating, use `MailSender`. It provides a traditional mail client API with To, CC, and BCC support.

### Basic Usage

```ts
import { KannonCli, MailSender } from 'kannon.js';

const kannon = new KannonCli(
  'your-domain.com',
  'your-api-key',
  { email: 'sender@your-domain.com', alias: 'Kannon' },
);

const mailSender = new MailSender(kannon);

await mailSender.send({
  to: 'user@example.com',
  subject: 'Hello',
  content: '<p>Hello, World!</p>',
});
```

### With CC and BCC

```ts
await mailSender.send({
  to: ['alice@example.com', 'bob@example.com'],
  cc: 'manager@example.com',
  bcc: 'archive@example.com',
  subject: 'Project Update',
  content: '<h1>Status Report</h1><p>All systems operational.</p>',
});
```

### With Attachments

```ts
import { readFileSync } from 'fs';

await mailSender.send({
  to: 'client@example.com',
  subject: 'Monthly Report',
  content: '<h1>Report</h1><p>See attachment.</p>',
  attachments: [
    {
      filename: 'report.pdf',
      content: readFileSync('./report.pdf'),
    },
  ],
});
```

### Scheduled Delivery

```ts
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);

await mailSender.send({
  to: 'user@example.com',
  subject: 'Scheduled Reminder',
  content: '<p>This email was scheduled.</p>',
  scheduledTime: tomorrow,
});
```

### Tracking

Mail sent through `MailSender` is **never tracked**: opens and links are both forced to `off`, and no `List-Unsubscribe` header is emitted. A plain mail client sends mail, it does not measure it.

Use `KannonCli` directly for campaign mail, where [tracking](#tracking-policy) and [one-click unsubscribe](#one-click-unsubscribe-rfc-8058) are decisions to make.

### MailSender API Reference

#### SendParams

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `to` | `string \| string[]` | Yes | Primary recipient(s) |
| `subject` | `string` | Yes | Email subject line |
| `content` | `string` | Yes | HTML email body |
| `cc` | `string \| string[]` | No | Carbon copy recipients (visible to all) |
| `bcc` | `string \| string[]` | No | Blind carbon copy recipients (hidden) |
| `attachments` | `Attachment[]` | No | File attachments |
| `scheduledTime` | `Date` | No | Schedule for future delivery |

#### SendResult

| Field | Type | Description |
|-------|------|-------------|
| `batchId` | `string` | Identifier of the created Batch |
| `scheduledTime` | `Date \| undefined` | Scheduled delivery time (if applicable) |
| `acceptedCount` | `number` | Recipients accepted and queued for delivery |
| `rejectedCount` | `number` | Recipients refused at intake |
| `rejectedRecipients` | `RejectedRecipient[]` | Every refusal, with its reason |

---

## Usage Examples (KannonCli)

### Basic Email Sending

#### Simple HTML Email

```ts
const html = `
  <h1>Welcome to Kannon!</h1>
  <p>Thank you for signing up.</p>
  <a href="https://kannon.dev">Visit our website</a>
`;

await kannon.sendHtml(['user@example.com'], 'Welcome to Kannon', html);
```

#### Multiple Recipients

```ts
const recipients = ['user1@example.com', 'user2@example.com', 'user3@example.com'];

await kannon.sendHtml(recipients, 'Important Update', '<h1>System Update</h1><p>We have important news for you.</p>');
```

#### With Attachments

```ts
import { readFileSync } from 'fs';

const pdfBuffer = readFileSync('./document.pdf');

await kannon.sendHtml(
  ['client@example.com'],
  'Your Invoice',
  '<h1>Invoice Attached</h1><p>Please find your invoice attached.</p>',
  {
    attachments: [
      {
        filename: 'invoice.pdf',
        content: pdfBuffer,
      },
      {
        filename: 'terms.txt',
        content: Buffer.from('Terms and conditions...'),
      },
    ],
  },
);
```

### Template Emails

#### Using Template IDs

```ts
await kannon.sendTemplate(['customer@example.com'], 'Your Order Confirmation', 'order-confirmation-template');
```

#### Templates with Attachments

```ts
await kannon.sendTemplate(['client@example.com'], 'Monthly Report', 'monthly-report-template', {
  attachments: [
    {
      filename: 'report.pdf',
      content: reportBuffer,
    },
  ],
});
```

### Personalized Emails

#### Individual Fields

```ts
const html = `
  <h1>Hello {{name}}!</h1>
  <p>Your account balance is: {{balance}}</p>
  <p>Last login: {{lastLogin}}</p>
`;

await kannon.sendHtml(
  [
    {
      email: 'john@example.com',
      fields: {
        name: 'John',
        balance: '$1,250',
        lastLogin: '2024-01-15',
      },
    },
    {
      email: 'jane@example.com',
      fields: {
        name: 'Jane',
        balance: '$890',
        lastLogin: '2024-01-14',
      },
    },
  ],
  'Account Update',
  html,
);
```

#### Mixed Recipient Types

```ts
const recipients = [
  'simple@example.com', // String format
  {
    email: 'personalized@example.com',
    fields: { name: 'Alice', role: 'Admin' },
  }, // Object format
  {
    email: 'another@example.com',
    fields: { name: 'Bob', role: 'User' },
  },
];

const html = `
  <h1>Hello {{name || 'there'}}!</h1>
  <p>Your role: {{role || 'Guest'}}</p>
`;

await kannon.sendHtml(recipients, 'Welcome', html);
```

### Global Fields

#### Shared Content for All Recipients

```ts
const html = `
  <h1>Hello {{name}}!</h1>
  <p>This is a message from {{company}}.</p>
  <p>Current date: {{currentDate}}</p>
  <p>Support email: {{supportEmail}}</p>
`;

await kannon.sendHtml(
  [
    { email: 'user1@example.com', fields: { name: 'John' } },
    { email: 'user2@example.com', fields: { name: 'Jane' } },
  ],
  'Company Update',
  html,
  {
    globalFields: {
      company: 'Kannon Corp',
      currentDate: new Date().toLocaleDateString(),
      supportEmail: 'support@kannon.dev',
    },
  },
);
```

### Scheduled Emails

#### Future Delivery

```ts
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);

await kannon.sendHtml(
  ['user@example.com'],
  "Tomorrow's Reminder",
  "<h1>Don't forget!</h1><p>Your meeting is tomorrow.</p>",
  {
    scheduledTime: tomorrow,
  },
);
```

#### Specific Date and Time

```ts
const scheduledTime = new Date('2024-02-01T10:00:00Z');

await kannon.sendTemplate(['subscriber@example.com'], 'Weekly Newsletter', 'newsletter-template', {
  scheduledTime,
  globalFields: {
    weekNumber: '5',
    year: '2024',
  },
});
```

### Email Headers (To/CC)

#### Adding CC Recipients

```ts
await kannon.sendHtml(
  ['primary@example.com'],
  'Project Update',
  '<h1>Project Status</h1><p>Here is the latest update.</p>',
  {
    headers: {
      cc: ['manager@example.com', 'team-lead@example.com'],
    },
  },
);
```

#### Custom To Header

```ts
await kannon.sendHtml(
  ['recipient@example.com'],
  'Meeting Invitation',
  '<h1>You are invited!</h1><p>Please join us for the quarterly review.</p>',
  {
    headers: {
      to: ['team@example.com'],
      cc: ['stakeholders@example.com'],
    },
  },
);
```

### Tracking Policy

How much of an email's engagement may be observed is a policy stated at three levels — domain, batch and recipient. The effective policy is the **most restrictive** of the three: a level closer to the recipient may only narrow what the level above allows, never widen it.

The modes, ordered by increasing collection:

| Mode | Meaning |
|------|---------|
| `off` | The channel is not observed at all |
| `anonymous` | Counted in aggregate only; nothing retained that isolates one recipient |
| `pseudonymous` | Reserved by the server: selecting it rejects the recipient |
| `identified` | Attributed to the recipient |
| `full` | Attributed, plus the IP address and user agent of the request |

Omitting an axis, or the policy altogether, states nothing and imposes no restriction of its own: the domain ceiling configured on the server decides.

#### Per Batch

```ts
await kannon.sendHtml(['user@example.com'], 'Password Reset', html, {
  tracking: { opens: 'off', links: 'off' },
});
```

A batch asking for more than its domain allows **fails the whole call**.

#### Per Recipient

State here the consent you hold in your own CRM:

```ts
await kannon.sendHtml(
  [
    { email: 'consented@example.com', tracking: { opens: 'identified', links: 'identified' } },
    { email: 'opted-out@example.com', tracking: { opens: 'off', links: 'off' } },
  ],
  'Newsletter',
  html,
);
```

A recipient asking for more than its domain allows is rejected on its own, with reason `tracking_above_ceiling`, while the rest of the batch proceeds.

#### Opting a Single Link Out

A link carrying `data-no-track` is left untouched by click tracking:

```html
<a href="https://example.com/unsubscribe" data-no-track>Unsubscribe</a>
```

### One-Click Unsubscribe (RFC 8058)

Kannon can carry a `List-Unsubscribe` / `List-Unsubscribe-Post` pair pointing at **your own** endpoint. It personalises the URL, emits it and DKIM-signs it, and does nothing else with it: it never calls the endpoint, keeps no suppression list, and records no engagement when a recipient uses it.

```ts
await kannon.sendHtml(recipients, 'Newsletter', html, {
  oneClickUnsubscribe: {
    urlTemplate: 'https://your-domain.com/unsub?email={{ email }}&token={{ token }}',
  },
});
```

Four things the API holds you to:

1. **The URL must be `https`.** A template that is malformed, relative or non-https fails the whole call.
2. **Your endpoint must accept `POST`** with body `List-Unsubscribe=One-Click` and unsubscribe with no further confirmation.
3. **Pass raw field values, not pre-encoded ones.** Kannon percent-encodes every value it substitutes.
4. **Every placeholder must resolve for every recipient.** One whose fields leave a placeholder unresolved is rejected with reason `unsubscribe_url_unresolved`. `{{ email }}` always resolves to the recipient address (`email` is reserved and cannot be overridden); a custom `{{ token }}` only does if you pass it for that recipient.

There is no domain-wide default and no per-recipient override: an unsubscribe header on a password reset offers the recipient something you cannot honour.

### Reply-To

```ts
await kannon.sendHtml(recipients, 'Support ticket #42', html, {
  replyTo: { email: 'support@your-domain.com', name: 'Support' },
});
```

When omitted, no `Reply-To` header is emitted and replies go to the sender.

### Rejected Recipients

A recipient refused at intake does not fail the send: it is reported back, with its position in the request, so you can reconcile what was actually queued.

```ts
const result = await kannon.sendHtml(recipients, 'Newsletter', html);

console.log(`${result.acceptedCount} queued, ${result.rejectedCount} rejected`);

for (const { email, index, reason } of result.rejectedRecipients) {
  console.warn(`recipient #${index} (${email}) was rejected: ${reason}`);
}
```

| Reason | Meaning |
|--------|---------|
| `invalid_email` | The address is empty or otherwise unusable |
| `duplicate_recipient` | The address repeats an earlier recipient of the same send |
| `tracking_above_ceiling` | The recipient's policy asks for more than its domain allows |
| `unsupported_tracking_mode` | The recipient stated a mode the server will not act on |
| `unsubscribe_url_unresolved` | A placeholder in the unsubscribe URL template was left unresolved |
| `unresolved_placeholder` | A placeholder in the subject or body was left unresolved |
| `reserved_field` | The recipient supplied a reserved field, such as `email` |
| `message_too_large` | The personalised message exceeds the size limit |

Treat an unrecognised value as a refusal of unknown cause: the set grows as new causes are added.

When **every** recipient is refused, no Batch is created and the call throws a `KannonError` with code `no_recipients_accepted`; its `errors` point at each refused row (`/recipients/<index>/...`).

### Safe Retries

Every send carries an `Idempotency-Key`. By default a fresh random key is used per call, so a retry creates a second Batch. Pass your own key and reuse it when retrying: for at least 24 hours the API returns the original Batch instead of creating a new one, with `replayed: true` and an empty `rejectedRecipients` (the original refusals are not retained).

```ts
const result = await kannon.sendHtml(recipients, 'Invoice', html, {
  idempotencyKey: `invoice-${invoice.id}`,
});

if (result.replayed) {
  console.log(`already sent as batch ${result.batchId}`);
}
```

### Configuration

By default the client talks to `https://api.kannon.email/v1`. For a self-hosted Kannon, point `endpoint` at its REST listener, version included:

```ts
const kannon = new KannonCli(
  'dev.example.com',
  'dev-api-key',
  { email: 'test@dev.example.com', alias: 'Dev Environment' },
  { endpoint: 'http://localhost:8081/v1' },
);
```

`config.fetch` replaces the global `fetch`, for example to add a proxy, timeouts or logging.

## API Reference

### KannonCli Constructor

```ts
new KannonCli(
  domain: string,
  apiKey: string,
  sender: KannonSender,
  config?: KannonConfig
)
```

- `domain`: your Kannon sending domain
- `apiKey`: an API key of that domain, sent as a Bearer token
- `sender`: `email` (sender address) and `alias` (display name, omitted when empty)
- `config`: optional `endpoint` (defaults to `https://api.kannon.email/v1`) and `fetch`

### Methods

#### sendHtml(recipients, subject, html, options?)

Sends an HTML email to the recipients as one Batch.

#### sendTemplate(recipients, subject, templateId, options?)

Sends a stored template to the recipients as one Batch.

Both resolve to a `KannonResult` and throw a `KannonError` when the API refuses the request.

### Options

```ts
type SendOptions = {
  scheduledTime?: Date; // Must be in the future; omit to send now
  globalFields?: Record<string, string>; // Fields shared by all recipients; `email` is reserved
  attachments?: {
    filename: string; // Unique within the send
    content: Uint8Array; // A Buffer works too
  }[];
  headers?: {
    to?: string[]; // Display-only To header
    cc?: string[]; // Display-only Cc header
  };
  replyTo?: { email: string; name?: string };
  tracking?: TrackingPolicy; // Batch-level tracking policy
  oneClickUnsubscribe?: {
    urlTemplate: string; // List-Unsubscribe endpoint (RFC 8058)
  };
  idempotencyKey?: string; // Reuse when retrying; defaults to a random key
};
```

### Result

```ts
type KannonResult = {
  batchId: string;
  scheduledTime: Date;
  acceptedCount: number; // Recipients queued for delivery
  rejectedCount: number; // Recipients refused at intake
  rejectedRecipients: RejectedRecipient[]; // Empty on a replay
  replayed: boolean; // True when the idempotency key matched an earlier send
};

type RejectedRecipient = {
  email: string;
  index: number; // Position in the request
  reason: RejectionReason;
};
```

### Types

```ts
type Recipient =
  | string // Simple email address
  | {
      email: string;
      fields?: Record<string, string>; // `email` is reserved
      tracking?: TrackingPolicy; // Consent held for this recipient
    };

type TrackingMode = 'off' | 'anonymous' | 'pseudonymous' | 'identified' | 'full';

type TrackingPolicy = {
  opens?: TrackingMode;
  links?: TrackingMode;
};

type KannonSender = {
  email: string;
  alias: string;
};

type KannonConfig = {
  endpoint?: string;
  fetch?: typeof fetch;
};
```

## Error Handling

A refused request throws a `KannonError` carrying the API's [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457) Problem Details. Branch on `code`, a stable token; `title` and `detail` are for humans.

```ts
import { KannonError } from 'kannon.js';

try {
  await kannon.sendHtml(['user@example.com'], 'Test Email', '<h1>Hello</h1>');
} catch (error) {
  if (!(error instanceof KannonError)) {
    throw error; // Network failure
  }
  switch (error.code) {
    case 'unauthenticated':
      console.error('Check your API key');
      break;
    case 'no_recipients_accepted':
      for (const e of error.errors) {
        console.error(`${e.pointer}: ${e.code}`);
      }
      break;
    case 'rate_limited':
      console.error(`Retry in ${error.retryAfter ?? 1}s`);
      break;
    default:
      console.error(error.status, error.code, error.requestId);
  }
}
```

`KannonError` exposes `status`, `code`, `title`, `detail`, `errors` (`{ code, pointer, detail }[]`), `requestId` and `retryAfter` (seconds). A response without Problem Details has code `http_error`.

## Migrating from v1

v2 sends through the Kannon REST API instead of gRPC, and drops the protobuf and Connect dependencies.

- **Endpoint**: `config` is optional and defaults to `https://api.kannon.email/v1`. If you set `endpoint` to a gRPC host (e.g. `https://grpc.kannon.email`), remove it, or point it at the REST base URL including `/v1`.
- **Authentication**: the API key is sent as `Authorization: Bearer <key>`; existing keys keep working.
- **Result**: `messageId` is now `batchId`, `templateId` is gone, and `replayed` is new. `RejectedRecipient` gains `index`. `MailSender`'s `SendResult` follows the same rename.
- **All recipients refused**: v1 resolved with `acceptedCount: 0`; v2 throws a `KannonError` with code `no_recipients_accepted`.
- **Errors**: Connect errors are replaced by `KannonError`.
- **Reserved `email` field**: a recipient or global field named `email` now rejects the recipient (`reserved_field`); `{{ email }}` always resolves to the recipient address.
- **New**: `replyTo`, `idempotencyKey`, and the `duplicate_recipient`, `unresolved_placeholder`, `reserved_field` and `message_too_large` rejection reasons.

## License

ISC
