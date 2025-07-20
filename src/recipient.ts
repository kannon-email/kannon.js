import { Recipient as KannonRecipient } from './proto/kannon/mailer/types/send_pb.js';

export type Recipient =
  | {
      email: string;
      fields?: Record<string, string>;
    }
  | string;

export function parseRecipent(recipient: Recipient): KannonRecipient {
  if (typeof recipient === 'string') {
    return new KannonRecipient({
      email: recipient,
      fields: {},
    });
  }
  return new KannonRecipient({
    email: recipient.email,
    fields: recipient.fields ?? {},
  });
}
