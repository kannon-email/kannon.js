## kannon.js is the official node client library for Kannon Email Sender

#### Usage

Instantiate kannon cli

```ts
const kannon = new KannonCli(
  '<YOUR DOMAIN>',
  '<API KEY>',
  {
    email: 'sender@kannon.dev',
    alias: 'Kannon',
  },
  {
    host: '<YOU KANNON API HOST>',
  },
);
```

### Basic Usage

```ts
async function sendHtml() {
  const html = `...`;

  return await kannon.sendMail(['test@email.com'], 'This is an email from kannon.js', html);
}
```

### Sending Templates

```ts
async function sendHtml() {
  const templateId = `...`;

  return await kannon.sendTemplate(['test@email.com'], 'This is an email from kannon.js', templateId);
}
```

### Sending Attachments

```ts
const res = await cli.sendHtml(
  [
    // ...
  ],
  'Send Attachment',
  html,
  {
    attachments: [
      {
        filename: 'test.txt',
        content: Buffer.from('Hello from Kannon!'),
      },
    ],
  },
);
```

### Fields and Global Fields

You can customize the html (or the template) per recipient by using fields parameters.

```ts
const html = `Hello {{name}}!`;

return await kannon.sendMail(
  [
    { email: 'test1@email.com', fields: { name: 'test 1' } },
    { email: 'test2@email.com', fields: { name: 'test 2' } }
  ],
  'This is an email from kannon.js',
  html,
);
```

The text between `{{` and `}}` will be replaced by the value of the field.

If you want to use the same field for all recipients, you can use the globalFields parameter.

```ts
const html = `Hello {{name}}! This is a global field: {{ global }}`;

return await kannon.sendMail(
  [
    { email: 'test1@email.com', fields: { name: 'test 1' } },
    { email: 'test2@email.com', fields: { name: 'test 2' } }
  ],
  'This is an email from kannon.js',
  html,
  {
    globalFields: { global: 'global value' }
  }
);
```
