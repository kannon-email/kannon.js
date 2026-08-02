# Kannon.js

[![CI](https://github.com/kannon-email/kannon.js/actions/workflows/ci.yml/badge.svg)](https://github.com/kannon-email/kannon.js/actions/workflows/ci.yml)

The official Node.js client library for Kannon Email Sender.

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
  {
    endpoint: 'https://api.kannon.dev',
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
  { endpoint: 'https://api.kannon.dev' },
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
| `messageId` | `string` | Unique identifier for the sent message |
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
4. **Every placeholder must resolve for every recipient.** One whose fields leave a placeholder unresolved is rejected with reason `unsubscribe_url_unresolved`. `{{ email }}` always resolves; a custom `{{ token }}` only does if you pass it for that recipient.

There is no domain-wide default and no per-recipient override: an unsubscribe header on a password reset offers the recipient something you cannot honour.

### Rejected Recipients

A recipient refused at intake does not fail the send: it is reported back so you can reconcile what was actually queued.

```ts
const result = await kannon.sendHtml(recipients, 'Newsletter', html);

console.log(`${result.acceptedCount} queued, ${result.rejectedCount} rejected`);

for (const { email, reason } of result.rejectedRecipients) {
  console.warn(`${email} was rejected: ${reason}`);
}
```

| Reason | Meaning |
|--------|---------|
| `invalid_email` | The address is empty or otherwise unusable |
| `tracking_above_ceiling` | The recipient's policy asks for more than its domain allows |
| `unsupported_tracking_mode` | The recipient stated a mode the server will not act on |
| `unsubscribe_url_unresolved` | A placeholder in the unsubscribe URL template was left unresolved |

Treat an unrecognised value as a refusal of unknown cause: the set grows as new causes are added.

### Advanced Configuration

#### Custom Domain Setup

```ts
const kannon = new KannonCli(
  'mycompany.com',
  'your-api-key',
  {
    email: 'noreply@mycompany.com',
    alias: 'My Company',
  },
  {
    endpoint: 'https://api.mycompany.com',
  },
);
```

#### Development Environment

```ts
const kannon = new KannonCli(
  'dev.example.com',
  'dev-api-key',
  {
    email: 'test@dev.example.com',
    alias: 'Dev Environment',
  },
  {
    endpoint: 'http://localhost:8080', // HTTP for local development
  },
);
```

#### Production with Custom Port

```ts
const kannon = new KannonCli(
  'production.com',
  'prod-api-key',
  {
    email: 'noreply@production.com',
    alias: 'Production System',
  },
  {
    endpoint: 'https://api.production.com:8443', // Custom HTTPS port
  },
);
```

## API Reference

### KannonCli Constructor

```ts
new KannonCli(
  domain: string,
  apiKey: string,
  sender: KannonSender,
  config: KannonConfig
)
```

#### Parameters:

- `domain`: Your Kannon domain
- `apiKey`: Your Kannon API key
- `sender`: Sender configuration
  - `email`: Sender email address
  - `alias`: Sender display name
- `config`: Client configuration
  - `endpoint`: API endpoint (must include protocol)

### Methods

#### sendHtml(recipients, subject, html, options?)

Sends an HTML email.

**Parameters:**

- `recipients`: Array of recipients (strings or objects with fields)
- `subject`: Email subject line
- `html`: HTML content of the email
- `options`: Optional configuration

#### sendTemplate(recipients, subject, templateId, options?)

Sends a template email.

**Parameters:**

- `recipients`: Array of recipients (strings or objects with fields)
- `subject`: Email subject line
- `templateId`: ID of the template to use
- `options`: Optional configuration

### Options

```ts
type SendOptions = {
  scheduledTime?: Date; // When to send the email
  globalFields?: Record<string, string>; // Fields shared by all recipients
  attachments?: {
    // File attachments
    filename: string;
    content: Buffer;
  }[];
  headers?: {
    // Email headers
    to?: string[]; // Additional To header addresses
    cc?: string[]; // CC header addresses
  };
  tracking?: TrackingPolicy; // Batch-level tracking policy
  oneClickUnsubscribe?: {
    // List-Unsubscribe endpoint (RFC 8058)
    urlTemplate: string;
  };
};
```

### Result

```ts
type KannonResult = {
  messageId: string;
  templateId: string;
  scheduledTime: Date;
  acceptedCount: number; // Recipients queued for delivery
  rejectedCount: number; // Recipients refused at intake
  rejectedRecipients: RejectedRecipient[];
};

type RejectedRecipient = {
  email: string;
  reason: RejectionReason;
};

type RejectionReason =
  | 'invalid_email'
  | 'tracking_above_ceiling'
  | 'unsupported_tracking_mode'
  | 'unsubscribe_url_unresolved'
  | (string & Record<never, never>); // The set grows as new causes are added
```

### Types

```ts
type Recipient =
  | string // Simple email address
  | {
      // Email with personalized fields
      email: string;
      fields?: Record<string, string>;
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
  endpoint: string;
};
```

## Error Handling

```ts
try {
  await kannon.sendHtml(['user@example.com'], 'Test Email', '<h1>Hello</h1>');
  console.log('Email sent successfully!');
} catch (error) {
  console.error('Failed to send email:', error.message);

  if (error.code === 'AUTHENTICATION_FAILED') {
    console.error('Check your API key and domain');
  } else if (error.code === 'INVALID_RECIPIENT') {
    console.error('Check recipient email addresses');
  }
}
```

## 🚨 Breaking Changes in v1.0.0

This version introduces breaking changes due to the migration from ts-proto to connect-es:

### Endpoint Configuration Changes

**Before (v1.0.0):**

```ts
const kannon = new KannonCli(
  'your-domain.com',
  'your-api-key',
  { email: 'sender@kannon.dev', alias: 'Kannon' },
  { host: 'api.kannon.dev:443' }, // ❌ Old format
);
```

**After (v1.0.0):**

```ts
const kannon = new KannonCli(
  'your-domain.com',
  'your-api-key',
  { email: 'sender@kannon.dev', alias: 'Kannon' },
  { endpoint: 'https://api.kannon.dev' }, // ✅ New format with protocol
);
```

### Key Changes:

- **Protocol required**: You must now specify the protocol (`https://` or `http://`)
- **Port optional**: Standard ports (443 for HTTPS, 80 for HTTP) are automatically used
- **TLS handling**: The `skipTLS` option is no longer supported
- **Parameter renamed**: `host` parameter is now `endpoint` for clarity

### Migration Examples:

| Old Format (host)    | New Format (endpoint)    |
| -------------------- | ------------------------ |
| `api.kannon.dev:443` | `https://api.kannon.dev` |
| `api.kannon.dev:80`  | `http://api.kannon.dev`  |
| `localhost:8080`     | `http://localhost:8080`  |
| `localhost:8443`     | `https://localhost:8443` |

### Migration Guide

If you're upgrading from v1.0.0:

1. **Update endpoint configuration** to include protocol
2. **Rename `host` to `endpoint`** in your configuration
3. **Remove port numbers** if using standard ports (443/80)
4. **Test your integration** to ensure compatibility

Example migration:

```ts
// Before
const kannon = new KannonCli('domain', 'key', sender, {
  host: 'api.kannon.dev:443',
});

// After
const kannon = new KannonCli('domain', 'key', sender, {
  endpoint: 'https://api.kannon.dev',
});
```

The `host` parameter is removed. Please use `endpoint` instead:

```ts
const kannon = new KannonCli('domain', 'key', sender, {
  endpoint: 'https://api.kannon.dev',
});
```

## License

ISC
