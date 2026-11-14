import { describe, expect, it, vi } from "vitest";
import { KannonCli } from "./kannon.js";
import { KannonError } from "./kannon-error.js";

const UUID = /^[0-9a-f-]{36}$/;
const SENDER = { alias: "Test Sender", email: "sender@example.com" };

const CREATED = {
  accepted_count: 1,
  id: "batch-1",
  rejected_count: 0,
  rejected_recipients: [],
  scheduled_at: "2026-11-14T10:00:00Z",
};

function jsonResponse(
  status: number,
  body: unknown,
  headers: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json", ...headers },
    status,
  });
}

function newCli(response: Response = jsonResponse(201, CREATED)) {
  const fetchStub = vi.fn<typeof fetch>().mockResolvedValue(response);
  const cli = new KannonCli("example.com", "api-key", SENDER, {
    endpoint: "http://localhost:8081/v1/",
    fetch: fetchStub,
  });
  return { cli, fetchStub };
}

function sentRequest(fetchStub: ReturnType<typeof vi.fn<typeof fetch>>) {
  const [url, init] = fetchStub.mock.calls[0];
  return {
    body: JSON.parse(String(init?.body)),
    headers: new Headers(init?.headers),
    method: init?.method,
    url: String(url),
  };
}

describe("KannonCli", () => {
  it("posts a Batch to the domain with a bearer key and an idempotency key", async () => {
    const { cli, fetchStub } = newCli();

    await cli.sendHtml(["user@example.com"], "Subject", "<p>Hello</p>");

    const request = sentRequest(fetchStub);
    expect(request.method).toBe("POST");
    expect(request.url).toBe(
      "http://localhost:8081/v1/domains/example.com/batches"
    );
    expect(request.headers.get("authorization")).toBe("Bearer api-key");
    expect(request.headers.get("content-type")).toBe("application/json");
    expect(request.headers.get("idempotency-key")).toMatch(UUID);
  });

  it("defaults to the public Kannon API", async () => {
    const fetchStub = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse(201, CREATED));
    const cli = new KannonCli("example.com", "api-key", SENDER, {
      fetch: fetchStub,
    });

    await cli.sendHtml(["user@example.com"], "Subject", "<p>Hello</p>");

    expect(sentRequest(fetchStub).url).toBe(
      "https://api.kannon.email/v1/domains/example.com/batches"
    );
  });

  it("uses a fresh idempotency key per call unless one is given", async () => {
    const { cli, fetchStub } = newCli();
    fetchStub.mockImplementation(() =>
      Promise.resolve(jsonResponse(201, CREATED))
    );

    await cli.sendHtml(["user@example.com"], "Subject", "<p>Hello</p>");
    await cli.sendHtml(["user@example.com"], "Subject", "<p>Hello</p>");
    await cli.sendHtml(["user@example.com"], "Subject", "<p>Hello</p>", {
      idempotencyKey: "my-key",
    });

    const keys = fetchStub.mock.calls.map(([, init]) =>
      new Headers(init?.headers).get("idempotency-key")
    );
    expect(keys[0]).not.toBe(keys[1]);
    expect(keys[2]).toBe("my-key");
  });

  it("sends only the required fields for a plain html send", async () => {
    const { cli, fetchStub } = newCli();

    await cli.sendHtml(["user@example.com"], "Subject", "<p>Hello</p>");

    expect(sentRequest(fetchStub).body).toEqual({
      content: { html: "<p>Hello</p>", type: "html" },
      from: { email: "sender@example.com", name: "Test Sender" },
      recipients: [{ email: "user@example.com" }],
      subject: "Subject",
    });
  });

  it("maps every send option onto the Batch", async () => {
    const { cli, fetchStub } = newCli();

    await cli.sendTemplate(
      [
        {
          email: "user@example.com",
          fields: { name: "User" },
          tracking: { opens: "off" },
        },
      ],
      "Subject",
      "template-id",
      {
        attachments: [
          { content: Buffer.from("hello"), filename: "a.txt" },
          { content: new TextEncoder().encode("world"), filename: "b.txt" },
        ],
        globalFields: { company: "ACME" },
        headers: { cc: ["cc@example.com"], to: ["to@example.com"] },
        oneClickUnsubscribe: {
          urlTemplate: "https://example.com/unsub?email={{ email }}",
        },
        replyTo: { email: "support@example.com", name: "Support" },
        scheduledTime: new Date("2030-01-01T00:00:00Z"),
        tracking: { links: "anonymous", opens: "identified" },
      }
    );

    expect(sentRequest(fetchStub).body).toEqual({
      attachments: [
        { content_base64: "aGVsbG8=", filename: "a.txt" },
        { content_base64: "d29ybGQ=", filename: "b.txt" },
      ],
      content: { template_id: "template-id", type: "template" },
      from: { email: "sender@example.com", name: "Test Sender" },
      global_fields: { company: "ACME" },
      headers: { cc: ["cc@example.com"], to: ["to@example.com"] },
      one_click_unsubscribe: {
        url_template: "https://example.com/unsub?email={{ email }}",
      },
      recipients: [
        {
          email: "user@example.com",
          fields: { name: "User" },
          tracking: { opens: "off" },
        },
      ],
      reply_to: { email: "support@example.com", name: "Support" },
      scheduled_at: "2030-01-01T00:00:00.000Z",
      subject: "Subject",
      tracking: { links: "anonymous", opens: "identified" },
    });
  });

  it("omits the sender name when it has no alias", async () => {
    const fetchStub = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse(201, CREATED));
    const cli = new KannonCli(
      "example.com",
      "api-key",
      { alias: "", email: "sender@example.com" },
      { fetch: fetchStub }
    );

    await cli.sendHtml(["user@example.com"], "Subject", "<p>Hello</p>");

    expect(sentRequest(fetchStub).body.from).toEqual({
      email: "sender@example.com",
    });
  });

  it("returns the receipt with every rejected recipient", async () => {
    const { cli } = newCli(
      jsonResponse(201, {
        ...CREATED,
        accepted_count: 1,
        rejected_count: 2,
        rejected_recipients: [
          {
            code: "invalid_email",
            detail: "Recipient refused: invalid_email",
            index: 1,
            pointer: "/recipients/1/email",
          },
          {
            code: "tracking_above_ceiling",
            detail: "Recipient refused: tracking_above_ceiling",
            index: 2,
            pointer: "/recipients/2/tracking",
          },
        ],
      })
    );

    const result = await cli.sendHtml(
      ["user@example.com", "not-an-email", "opted-out@example.com"],
      "Subject",
      "<p>Hello</p>"
    );

    expect(result).toEqual({
      acceptedCount: 1,
      batchId: "batch-1",
      rejectedCount: 2,
      rejectedRecipients: [
        { email: "not-an-email", index: 1, reason: "invalid_email" },
        {
          email: "opted-out@example.com",
          index: 2,
          reason: "tracking_above_ceiling",
        },
      ],
      replayed: false,
      scheduledTime: new Date("2026-11-14T10:00:00Z"),
    });
  });

  it("flags an idempotent replay", async () => {
    const { cli } = newCli(
      jsonResponse(200, {
        accepted_count: 2,
        created_at: "2026-11-14T09:59:00Z",
        domain: "example.com",
        id: "batch-1",
        rejected_count: 1,
        scheduled_at: "2026-11-14T10:00:00Z",
      })
    );

    const result = await cli.sendHtml(
      ["user@example.com"],
      "Subject",
      "<p>Hello</p>",
      { idempotencyKey: "my-key" }
    );

    expect(result).toEqual({
      acceptedCount: 2,
      batchId: "batch-1",
      rejectedCount: 1,
      rejectedRecipients: [],
      replayed: true,
      scheduledTime: new Date("2026-11-14T10:00:00Z"),
    });
  });

  it("throws a KannonError when every recipient is refused", async () => {
    const { cli } = newCli(
      jsonResponse(
        422,
        {
          code: "no_recipients_accepted",
          errors: [
            {
              code: "invalid_email",
              detail: "Recipient refused: invalid_email",
              pointer: "/recipients/0/email",
            },
          ],
          request_id: "req-1",
          status: 422,
          title: "Unprocessable Entity",
          type: "urn:kannon:problem:no_recipients_accepted",
        },
        { "Content-Type": "application/problem+json" }
      )
    );

    const error = await cli
      .sendHtml(["not-an-email"], "Subject", "<p>Hello</p>")
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(KannonError);
    expect(error).toMatchObject({
      code: "no_recipients_accepted",
      errors: [
        {
          code: "invalid_email",
          detail: "Recipient refused: invalid_email",
          pointer: "/recipients/0/email",
        },
      ],
      requestId: "req-1",
      status: 422,
      title: "Unprocessable Entity",
    });
  });

  it("exposes Retry-After on a rate limited send", async () => {
    const { cli } = newCli(
      jsonResponse(
        429,
        {
          code: "rate_limited",
          request_id: "req-2",
          status: 429,
          title: "Too Many Requests",
          type: "urn:kannon:problem:rate_limited",
        },
        { "Retry-After": "3" }
      )
    );

    await expect(
      cli.sendHtml(["user@example.com"], "Subject", "<p>Hello</p>")
    ).rejects.toMatchObject({ code: "rate_limited", retryAfter: 3 });
  });

  it("falls back to http_error when the response carries no Problem Details", async () => {
    const { cli } = newCli(
      new Response("upstream down", { status: 502, statusText: "Bad Gateway" })
    );

    await expect(
      cli.sendHtml(["user@example.com"], "Subject", "<p>Hello</p>")
    ).rejects.toMatchObject({
      code: "http_error",
      errors: [],
      status: 502,
      title: "Bad Gateway",
    });
  });
});
