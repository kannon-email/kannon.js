import { create } from "@bufbuild/protobuf";
import {
  type Recipient as KannonRecipient,
  RecipientSchema,
} from "./proto/kannon/mailer/types/send_pb.js";
import { parseTrackingPolicy, type TrackingPolicy } from "./tracking.js";

export type Recipient =
  | {
      email: string;
      fields?: Record<string, string>;
      /**
       * The consent this recipient has given, as held in your own CRM.
       *
       * Omitted states nothing and imposes no restriction of its own. It may
       * only narrow what the batch and the domain already allow: a recipient
       * asking for more than its domain permits is rejected on its own, with
       * reason `tracking_above_ceiling`, while the rest of the batch proceeds.
       */
      tracking?: TrackingPolicy;
    }
  | string;

export function parseRecipient(recipient: Recipient): KannonRecipient {
  if (typeof recipient === "string") {
    return create(RecipientSchema, { email: recipient, fields: {} });
  }
  return create(RecipientSchema, {
    email: recipient.email,
    fields: recipient.fields ?? {},
    tracking: parseTrackingPolicy(recipient.tracking),
  });
}
