import {
  type TrackingPolicy,
  type TrackingWire,
  toTrackingWire,
} from "./tracking.js";

export type Recipient =
  | {
      email: string;
      /**
       * Personalisation values for this recipient, overriding global fields.
       * `email` is reserved: supplying it rejects the recipient with reason
       * `reserved_field`.
       */
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

export interface RecipientWire {
  email: string;
  fields?: Record<string, string>;
  tracking?: TrackingWire;
}

export function toRecipientWire(recipient: Recipient): RecipientWire {
  if (typeof recipient === "string") {
    return { email: recipient };
  }
  const wire: RecipientWire = { email: recipient.email };
  if (recipient.fields && Object.keys(recipient.fields).length > 0) {
    wire.fields = recipient.fields;
  }
  const tracking = toTrackingWire(recipient.tracking);
  if (tracking) {
    wire.tracking = tracking;
  }
  return wire;
}
