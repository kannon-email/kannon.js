import { create } from "@bufbuild/protobuf";
import {
  type Recipient as KannonRecipient,
  RecipientSchema,
} from "./proto/kannon/mailer/types/send_pb.js";

export type Recipient =
  | {
      email: string;
      fields?: Record<string, string>;
    }
  | string;

export function parseRecipient(recipient: Recipient): KannonRecipient {
  if (typeof recipient === "string") {
    return create(RecipientSchema, { email: recipient, fields: {} });
  }
  return create(RecipientSchema, {
    email: recipient.email,
    fields: recipient.fields ?? {},
  });
}
