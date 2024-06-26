import { Recipient as KannonRecipient } from './proto/kannon/mailer/types/send';

export type Recipient =
  | {
      email: string;
      fields?: Record<string, string>;
    }
  | string;

export function parseRecipent(recipient: Recipient): KannonRecipient {
  if (typeof recipient === 'string') {
    return {
      email: recipient,
      fields: {},
    };
  }
  return {
    email: recipient.email,
    fields: recipient.fields ?? {},
  };
}
