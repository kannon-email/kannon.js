import { describe, expect, it } from "vitest";
import { toRecipientWire } from "./recipient.js";

describe("toRecipientWire", () => {
  it("maps a string recipient to its address alone", () => {
    expect(toRecipientWire("test@example.com")).toEqual({
      email: "test@example.com",
    });
  });

  it("omits empty or absent fields", () => {
    expect(toRecipientWire({ email: "test@example.com" })).toEqual({
      email: "test@example.com",
    });
    expect(toRecipientWire({ email: "test@example.com", fields: {} })).toEqual({
      email: "test@example.com",
    });
  });

  it("carries the recipient fields", () => {
    expect(
      toRecipientWire({
        email: "test@example.com",
        fields: { company: "Test Corp", name: "John Doe" },
      })
    ).toEqual({
      email: "test@example.com",
      fields: { company: "Test Corp", name: "John Doe" },
    });
  });

  it("carries the recipient tracking policy", () => {
    expect(
      toRecipientWire({
        email: "test@example.com",
        tracking: { links: "anonymous", opens: "off" },
      }).tracking
    ).toEqual({ links: "anonymous", opens: "off" });
  });

  it("omits an unstated tracking axis", () => {
    expect(
      toRecipientWire({ email: "test@example.com", tracking: { opens: "off" } })
        .tracking
    ).toEqual({ opens: "off" });
  });
});
