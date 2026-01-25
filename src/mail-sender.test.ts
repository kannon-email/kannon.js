import { beforeEach, describe, expect, it, vi } from "vitest";
import type { KannonCli } from "./kannon";
import { MailSender } from "./mail-sender";

describe("MailSender", () => {
  let mockClient: KannonCli;
  let mailSender: MailSender;

  beforeEach(() => {
    mockClient = {
      sendHtml: vi.fn().mockResolvedValue({
        messageId: "test-id",
        templateId: "",
        scheduledTime: new Date("2024-01-01T00:00:00Z"),
      }),
    } as unknown as KannonCli;

    mailSender = new MailSender(mockClient);
  });

  it("maps single to recipient correctly", async () => {
    await mailSender.send({
      to: "user@example.com",
      subject: "Test",
      content: "<p>Hello</p>",
    });

    expect(mockClient.sendHtml).toHaveBeenCalledWith(
      ["user@example.com"],
      "Test",
      "<p>Hello</p>",
      expect.objectContaining({
        headers: { to: ["user@example.com"], cc: undefined },
      })
    );
  });

  it("maps multiple to recipients correctly", async () => {
    await mailSender.send({
      to: ["user1@example.com", "user2@example.com"],
      subject: "Test",
      content: "<p>Hello</p>",
    });

    expect(mockClient.sendHtml).toHaveBeenCalledWith(
      ["user1@example.com", "user2@example.com"],
      "Test",
      "<p>Hello</p>",
      expect.objectContaining({
        headers: {
          to: ["user1@example.com", "user2@example.com"],
          cc: undefined,
        },
      })
    );
  });

  it("includes cc recipients in all recipients and headers", async () => {
    await mailSender.send({
      to: "user@example.com",
      cc: "cc@example.com",
      subject: "Test",
      content: "<p>Hello</p>",
    });

    expect(mockClient.sendHtml).toHaveBeenCalledWith(
      ["user@example.com", "cc@example.com"],
      "Test",
      "<p>Hello</p>",
      expect.objectContaining({
        headers: { to: ["user@example.com"], cc: ["cc@example.com"] },
      })
    );
  });

  it("includes multiple cc recipients correctly", async () => {
    await mailSender.send({
      to: "user@example.com",
      cc: ["cc1@example.com", "cc2@example.com"],
      subject: "Test",
      content: "<p>Hello</p>",
    });

    expect(mockClient.sendHtml).toHaveBeenCalledWith(
      ["user@example.com", "cc1@example.com", "cc2@example.com"],
      "Test",
      "<p>Hello</p>",
      expect.objectContaining({
        headers: {
          to: ["user@example.com"],
          cc: ["cc1@example.com", "cc2@example.com"],
        },
      })
    );
  });

  it("includes bcc in recipients but not in headers", async () => {
    await mailSender.send({
      to: "user@example.com",
      bcc: "bcc@example.com",
      subject: "Test",
      content: "<p>Hello</p>",
    });

    expect(mockClient.sendHtml).toHaveBeenCalledWith(
      ["user@example.com", "bcc@example.com"],
      "Test",
      "<p>Hello</p>",
      expect.objectContaining({
        headers: { to: ["user@example.com"], cc: undefined },
      })
    );
  });

  it("handles all recipient types together", async () => {
    await mailSender.send({
      to: ["to1@example.com", "to2@example.com"],
      cc: "cc@example.com",
      bcc: ["bcc1@example.com", "bcc2@example.com"],
      subject: "Test",
      content: "<p>Hello</p>",
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
          to: ["to1@example.com", "to2@example.com"],
          cc: ["cc@example.com"],
        },
      })
    );
  });

  it("passes attachments through unchanged", async () => {
    const attachments = [
      { filename: "test.pdf", content: Buffer.from("test content") },
    ];

    await mailSender.send({
      to: "user@example.com",
      subject: "Test",
      content: "<p>Hello</p>",
      attachments,
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
      to: "user@example.com",
      subject: "Test",
      content: "<p>Hello</p>",
      scheduledTime,
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

  it("returns messageId and scheduledTime from result", async () => {
    const result = await mailSender.send({
      to: "user@example.com",
      subject: "Test",
      content: "<p>Hello</p>",
    });

    expect(result).toEqual({
      messageId: "test-id",
      scheduledTime: new Date("2024-01-01T00:00:00Z"),
    });
  });
});
