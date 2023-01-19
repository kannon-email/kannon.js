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
async function sendHtml() {
  const html = `<html>
<body>
	<h1>Email from Kannon!</h1>
	<p>This is a test email from <a href="https://www.kannon.email">Kannon</a></p>
</body>
</html>`;

  return await kannon.sendMail(
    [{ email: 'test@email.com', fields: {} }],
    'This is an email from kannon.js',
    html,
    new Date(), // <- This can be used to chedule email, default now
  );
}
```
