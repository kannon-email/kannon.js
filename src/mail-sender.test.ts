import { beforeEach, describe, expect, it, vi } from "vitest";
import type { KannonCli } from "./kannon.js";
import { MailSender } from "./mail-sender.js";

describe("MailSender", () => {
  let mockClient: KannonCli;
  let mailSender: MailSender;

  beforeEach(() => {
    mockClient = {
      sendHtml: vi.fn().mockResolvedValue({
        acceptedCount: 1,
        messageId: "test-id",
        rejectedCount: 0,
        rejectedRecipients: [],
        scheduledTime: new Date("2024-01-01T00:00:00Z"),
        templateId: "",
      }),
    } as unknown as KannonCli;

    mailSender = new MailSender(mockClient);
  });

  it("maps single to recipient correctly", async () => {
    await mailSender.send({
      content: "<p>Hello</p>",
      subject: "Test",
      to: "user@example.com",
    });

    expect(mockClient.sendHtml).toHaveBeenCalledWith(
      ["user@example.com"],
      "Test",
      "<p>Hello</p>",
      expect.objectContaining({
        headers: { cc: undefined, to: ["user@example.com"] },
      })
    );
  });

  it("maps multiple to recipients correctly", async () => {
    await mailSender.send({
      content: "<p>Hello</p>",
      subject: "Test",
      to: ["user1@example.com", "user2@example.com"],
    });

    expect(mockClient.sendHtml).toHaveBeenCalledWith(
      ["user1@example.com", "user2@example.com"],
      "Test",
      "<p>Hello</p>",
      expect.objectContaining({
        headers: {
          cc: undefined,
          to: ["user1@example.com", "user2@example.com"],
        },
      })
    );
  });

  it("includes cc recipients in all recipients and headers", async () => {
    await mailSender.send({
      cc: "cc@example.com",
      content: "<p>Hello</p>",
      subject: "Test",
      to: "user@example.com",
    });

    expect(mockClient.sendHtml).toHaveBeenCalledWith(
      ["user@example.com", "cc@example.com"],
      "Test",
      "<p>Hello</p>",
      expect.objectContaining({
        headers: { cc: ["cc@example.com"], to: ["user@example.com"] },
      })
    );
  });

  it("includes multiple cc recipients correctly", async () => {
    await mailSender.send({
      cc: ["cc1@example.com", "cc2@example.com"],
      content: "<p>Hello</p>",
      subject: "Test",
      to: "user@example.com",
    });

    expect(mockClient.sendHtml).toHaveBeenCalledWith(
      ["user@example.com", "cc1@example.com", "cc2@example.com"],
      "Test",
      "<p>Hello</p>",
      expect.objectContaining({
        headers: {
          cc: ["cc1@example.com", "cc2@example.com"],
          to: ["user@example.com"],
        },
      })
    );
  });

  it("includes bcc in recipients but not in headers", async () => {
    await mailSender.send({
      bcc: "bcc@example.com",
      content: "<p>Hello</p>",
      subject: "Test",
      to: "user@example.com",
    });

    expect(mockClient.sendHtml).toHaveBeenCalledWith(
      ["user@example.com", "bcc@example.com"],
      "Test",
      "<p>Hello</p>",
      expect.objectContaining({
        headers: { cc: undefined, to: ["user@example.com"] },
      })
    );
  });

  it("handles all recipient types together", async () => {
    await mailSender.send({
      bcc: ["bcc1@example.com", "bcc2@example.com"],
      cc: "cc@example.com",
      content: "<p>Hello</p>",
      subject: "Test",
      to: ["to1@example.com", "to2@example.com"],
    });

    expect(mockClient.sendHtml).toHaveBeenCalledWith(
      [
        "to1@example.com",
        "to2@example.com",
        "cc@example.com",
        "bcc1@example.com",
        "bcc2@example.com",
      ],
      "Test",
      "<p>Hello</p>",
      expect.objectContaining({
        headers: {
          cc: ["cc@example.com"],
          to: ["to1@example.com", "to2@example.com"],
        },
      })
    );
  });

  it("passes attachments through unchanged", async () => {
    const attachments = [
      { content: Buffer.from("test content"), filename: "test.pdf" },
    ];

    await mailSender.send({
      attachments,
      content: "<p>Hello</p>",
      subject: "Test",
      to: "user@example.com",
    });

    expect(mockClient.sendHtml).toHaveBeenCalledWith(
      ["user@example.com"],
      "Test",
      "<p>Hello</p>",
      expect.objectContaining({
        attachments,
      })
    );
  });

  it("passes scheduledTime through unchanged", async () => {
    const scheduledTime = new Date("2024-12-25T10:00:00Z");

    await mailSender.send({
      content: "<p>Hello</p>",
      scheduledTime,
      subject: "Test",
      to: "user@example.com",
    });

    expect(mockClient.sendHtml).toHaveBeenCalledWith(
      ["user@example.com"],
      "Test",
      "<p>Hello</p>",
      expect.objectContaining({
        scheduledTime,
      })
    );
  });

  it("always disables open and link tracking", async () => {
    await mailSender.send({
      content: "<p>Hello</p>",
      subject: "Test",
      to: "user@example.com",
    });

    expect(mockClient.sendHtml).toHaveBeenCalledWith(
      ["user@example.com"],
      "Test",
      "<p>Hello</p>",
      expect.objectContaining({ tracking: { links: "off", opens: "off" } })
    );
  });

  it("never emits an unsubscribe header", async () => {
    await mailSender.send({
      content: "<p>Hello</p>",
      subject: "Test",
      to: "user@example.com",
    });

    const [call] = vi.mocked(mockClient.sendHtml).mock.calls;
    expect(call[3]?.oneClickUnsubscribe).toBeUndefined();
  });

  it("returns messageId, scheduledTime and intake counts from result", async () => {
    const result = await mailSender.send({
      content: "<p>Hello</p>",
      subject: "Test",
      to: "user@example.com",
    });

    expect(result).toEqual({
      acceptedCount: 1,
      messageId: "test-id",
      rejectedCount: 0,
      rejectedRecipients: [],
      scheduledTime: new Date("2024-01-01T00:00:00Z"),
    });
  });

  it("reports rejected recipients instead of failing the send", async () => {
    const rejectedRecipients = [
      { email: "not-an-email", reason: "invalid_email" },
      { email: "opted-out@example.com", reason: "tracking_above_ceiling" },
    ];
    mockClient.sendHtml = vi.fn().mockResolvedValue({
      acceptedCount: 1,
      messageId: "test-id",
      rejectedCount: 2,
      rejectedRecipients,
      scheduledTime: new Date("2024-01-01T00:00:00Z"),
      templateId: "",
    });

    const result = await mailSender.send({
      content: "<p>Hello</p>",
      subject: "Test",
      to: ["user@example.com", "not-an-email", "opted-out@example.com"],
    });

    expect(result.acceptedCount).toBe(1);
    expect(result.rejectedCount).toBe(2);
    expect(result.rejectedRecipients).toEqual(rejectedRecipients);
  });
});
