# Kannon.js

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

## Usage Examples

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
};
```

### Types

```ts
type Recipient =
  | string // Simple email address
  | {
      // Email with personalized fields
      email: string;
      fields?: Record<string, string>;
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
