## kannon.js is the official node client library for Kannon Email Sender

#### Usage

Instantiate kannon cli

```ts
const kannon = new KannonCli(
  '<YOUR DONMAIN>',
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

Usage

```ts
async function sendEmail() {
  return await kannon.sendMail(
    [{ email: 'test@email.com', fields: {} }],
    'This is an email kannon.js',
    'email html',
    new Date(), // <- This can be used to chedule email, default now
  );
}
```
