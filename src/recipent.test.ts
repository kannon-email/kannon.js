import { describe, expect, it } from "vitest";
import { TrackingMode } from "./proto/kannon/tracking/types/tracking_pb.js";
import { parseRecipient, type Recipient } from "./recipient.js";

describe("parseRecipent", () => {
  it("should parse string recipient correctly", () => {
    const recipient: Recipient = "test@example.com";
    const result = parseRecipient(recipient);

    expect(result).toMatchObject({
      email: "test@example.com",
      fields: {},
    });
  });

  it("should parse object recipient with email only", () => {
    const recipient: Recipient = {
      email: "test@example.com",
    };
    const result = parseRecipient(recipient);

    expect(result).toMatchObject({
      email: "test@example.com",
      fields: {},
    });
  });

  it("should parse object recipient with email and fields", () => {
    const recipient: Recipient = {
      email: "test@example.com",
      fields: {
        company: "Test Corp",
        name: "John Doe",
      },
    };
    const result = parseRecipient(recipient);

    expect(result).toMatchObject({
      email: "test@example.com",
      fields: {
        company: "Test Corp",
        name: "John Doe",
      },
    });
  });

  it("should parse object recipient with undefined fields", () => {
    const recipient: Recipient = {
      email: "test@example.com",
      fields: undefined,
    };
    const result = parseRecipient(recipient);

    expect(result).toMatchObject({
      email: "test@example.com",
      fields: {},
    });
  });

  it("should parse object recipient with empty fields object", () => {
    const recipient: Recipient = {
      email: "test@example.com",
      fields: {},
    };
    const result = parseRecipient(recipient);

    expect(result).toMatchObject({
      email: "test@example.com",
      fields: {},
    });
  });

  it("should handle complex field values", () => {
    const recipient: Recipient = {
      email: "test@example.com",
      fields: {
        age: "30",
        isActive: "true",
        name: "John Doe",
        preferences: '["email", "sms"]',
      },
    };
    const result = parseRecipient(recipient);

    expect(result).toMatchObject({
      email: "test@example.com",
      fields: {
        age: "30",
        isActive: "true",
        name: "John Doe",
        preferences: '["email", "sms"]',
      },
    });
  });

  it("should leave tracking unset when the recipient states nothing", () => {
    const result = parseRecipient({ email: "test@example.com" });

    expect(result.tracking).toBeUndefined();
  });

  it("should parse a recipient tracking policy", () => {
    const result = parseRecipient({
      email: "test@example.com",
      tracking: { links: "anonymous", opens: "off" },
    });

    expect(result.tracking).toMatchObject({
      links: TrackingMode.ANONYMOUS,
      opens: TrackingMode.OFF,
    });
  });

  it("should mark an omitted tracking axis as unspecified", () => {
    const result = parseRecipient({
      email: "test@example.com",
      tracking: { opens: "off" },
    });

    expect(result.tracking).toMatchObject({
      links: TrackingMode.UNSPECIFIED,
      opens: TrackingMode.OFF,
    });
  });
});

describe("Recipient type", () => {
  it("should accept string recipient", () => {
    const recipient: Recipient = "test@example.com";
    expect(typeof recipient).toBe("string");
  });

  it("should accept object recipient", () => {
    const recipient: Recipient = {
      email: "test@example.com",
      fields: { name: "John" },
    };
    expect(typeof recipient).toBe("object");
    expect(recipient.email).toBe("test@example.com");
  });

  it("should accept object recipient without fields", () => {
    const recipient: Recipient = {
      email: "test@example.com",
    };
    expect(typeof recipient).toBe("object");
    expect(recipient.email).toBe("test@example.com");
  });
});
