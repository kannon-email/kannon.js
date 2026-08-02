import { beforeEach, describe, expect, it, vi } from "vitest";
import { KannonCli } from "./kannon.js";
import type {
  SendHTMLReq,
  SendTemplateReq,
} from "./proto/kannon/mailer/apiv1/mailerapiv1_pb.js";
import { TrackingMode } from "./proto/kannon/tracking/types/tracking_pb.js";

const { sendHTML, sendTemplate } = vi.hoisted(() => ({
  sendHTML: vi.fn(),
  sendTemplate: vi.fn(),
}));

vi.mock("@connectrpc/connect", () => ({
  createClient: () => ({ sendHTML, sendTemplate }),
}));

vi.mock("@connectrpc/connect-node", () => ({
  createGrpcTransport: () => ({}),
}));

const emptyResponse = {
  acceptedCount: 0,
  messageId: "message-id",
  rejectedCount: 0,
  rejectedRecipients: [],
  scheduledTime: undefined,
  templateId: "template-id",
};

function newCli() {
  return new KannonCli(
    "example.com",
    "api-key",
    { alias: "Test Sender", email: "sender@example.com" },
    { endpoint: "http://localhost:8080" }
  );
}

describe("KannonCli", () => {
  beforeEach(() => {
    sendHTML.mockReset().mockResolvedValue(emptyResponse);
    sendTemplate.mockReset().mockResolvedValue(emptyResponse);
  });

  it("authenticates with the base64 encoded domain and api key", async () => {
    await newCli().sendHtml(["user@example.com"], "Subject", "<p>Hello</p>");

    const expected = Buffer.from("example.com:api-key").toString("base64");
    expect(sendHTML.mock.calls[0][1]).toMatchObject({
      headers: { authorization: `Basic ${expected}` },
    });
  });

  it("leaves tracking and unsubscribe unset when not requested", async () => {
    await newCli().sendHtml(["user@example.com"], "Subject", "<p>Hello</p>");

    const request = sendHTML.mock.calls[0][0] as SendHTMLReq;
    expect(request.tracking).toBeUndefined();
    expect(request.oneClickUnsubscribe).toBeUndefined();
  });

  it("carries the batch tracking policy on an html send", async () => {
    await newCli().sendHtml(["user@example.com"], "Subject", "<p>Hello</p>", {
      tracking: { links: "off", opens: "anonymous" },
    });

    const request = sendHTML.mock.calls[0][0] as SendHTMLReq;
    expect(request.tracking).toMatchObject({
      links: TrackingMode.OFF,
      opens: TrackingMode.ANONYMOUS,
    });
  });

  it("carries the one-click unsubscribe endpoint on an html send", async () => {
    await newCli().sendHtml(["user@example.com"], "Subject", "<p>Hello</p>", {
      oneClickUnsubscribe: {
        urlTemplate: "https://example.com/unsub?email={{ email }}",
      },
    });

    const request = sendHTML.mock.calls[0][0] as SendHTMLReq;
    expect(request.oneClickUnsubscribe).toMatchObject({
      urlTemplate: "https://example.com/unsub?email={{ email }}",
    });
  });

  it("carries tracking and unsubscribe on a template send", async () => {
    await newCli().sendTemplate(
      [{ email: "user@example.com", tracking: { opens: "off" } }],
      "Subject",
      "template-id",
      {
        oneClickUnsubscribe: { urlTemplate: "https://example.com/unsub" },
        tracking: { opens: "identified" },
      }
    );

    const request = sendTemplate.mock.calls[0][0] as SendTemplateReq;
    expect(request.templateId).toBe("template-id");
    expect(request.tracking).toMatchObject({
      opens: TrackingMode.IDENTIFIED,
    });
    expect(request.oneClickUnsubscribe).toMatchObject({
      urlTemplate: "https://example.com/unsub",
    });
    expect(request.recipients[0].tracking).toMatchObject({
      opens: TrackingMode.OFF,
    });
  });

  it("returns the intake counts and every rejected recipient", async () => {
    sendHTML.mockResolvedValue({
      ...emptyResponse,
      acceptedCount: 1,
      rejectedCount: 2,
      rejectedRecipients: [
        { email: "not-an-email", reason: "invalid_email" },
        { email: "opted-out@example.com", reason: "tracking_above_ceiling" },
      ],
    });

    const result = await newCli().sendHtml(
      ["user@example.com", "not-an-email", "opted-out@example.com"],
      "Subject",
      "<p>Hello</p>"
    );

    expect(result.acceptedCount).toBe(1);
    expect(result.rejectedCount).toBe(2);
    expect(result.rejectedRecipients).toEqual([
      { email: "not-an-email", reason: "invalid_email" },
      { email: "opted-out@example.com", reason: "tracking_above_ceiling" },
    ]);
  });
});
