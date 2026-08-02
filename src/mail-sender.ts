import type { KannonResult, RejectedRecipient, SendOptions } from "./kannon.js";
import type { Recipient } from "./recipient.js";
import type { TrackingPolicy } from "./tracking.js";

/**
 * A plain mail client sends mail, it does not measure it: every email sent
 * through `MailSender` opts out of open and link tracking.
 */
const NO_TRACKING: TrackingPolicy = { links: "off", opens: "off" };

/**
 * Email attachment.
 */
export interface Attachment {
  /** The file content as a Buffer. */
  content: Buffer;
  /** The filename that will appear in the email. */
  filename: string;
}

/**
 * Result returned after sending an email.
 */
export interface SendResult {
  /** How many recipients were accepted and are queued for delivery. */
  acceptedCount: number;
  /** Unique identifier for the sent message. */
  messageId: string;
  /** How many recipients were refused at intake. */
  rejectedCount: number;
  /** Every recipient refused at intake, with the reason for the refusal. */
  rejectedRecipients: RejectedRecipient[];
  /** The scheduled delivery time, if the email was scheduled. */
  scheduledTime?: Date;
}

/**
 * Parameters for sending an email.
 */
export interface SendParams {
  /** File attachments to include with the email. */
  attachments?: Attachment[];
  /** Blind carbon copy recipient(s). Hidden from other recipients. */
  bcc?: string | string[];
  /** Carbon copy recipient(s). Visible to all recipients. */
  cc?: string | string[];
  /** Email body content as HTML. */
  content: string;
  /** Schedule the email for future delivery. If not provided, sends immediately. */
  scheduledTime?: Date;
  /** Email subject line. */
  subject: string;
  /** Primary recipient(s). Can be a single email address or an array of addresses. */
  to: string | string[];
}

interface MailClient {
  sendHtml: (
    recipients: Recipient[],
    subject: string,
    html: string,
    options?: SendOptions
  ) => Promise<KannonResult>;
}

function mapToArray(value: string | string[] | undefined): string[] {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

/**
 * A simplified mail client for sending emails without templating.
 *
 * Wraps `KannonCli` with a traditional mail API that accepts plain HTML content
 * and supports To, CC, and BCC recipients.
 *
 * Mail sent this way is never tracked: opens and links are both forced to `off`,
 * and no `List-Unsubscribe` header is emitted. Use `KannonCli` directly for
 * campaign mail, where those are decisions to make.
 *
 * @example
 * ```typescript
 * const client = new KannonCli(domain, apiKey, sender, config);
 * const mailSender = new MailSender(client);
 *
 * await mailSender.send({
 *   to: "user@example.com",
 *   subject: "Hello",
 *   content: "<p>Hello, World!</p>",
 * });
 * ```
 *
 * @example
 * ```typescript
 * // With CC, BCC, and attachments
 * await mailSender.send({
 *   to: ["alice@example.com", "bob@example.com"],
 *   cc: "manager@example.com",
 *   bcc: "archive@example.com",
 *   subject: "Monthly Report",
 *   content: "<h1>Report</h1><p>See attachment.</p>",
 *   attachments: [
 *     { filename: "report.pdf", content: pdfBuffer },
 *   ],
 * });
 * ```
 */
export class MailSender {
  private readonly client: MailClient;

  /**
   * Creates a new MailSender instance.
   *
   * @param client - A KannonCli instance to use for sending emails.
   */
  constructor(client: MailClient) {
    this.client = client;
  }

  /**
   * Sends an email.
   *
   * @param params - The email parameters including recipients, subject, and content.
   * @returns A promise that resolves with the message ID and scheduled time.
   *
   * @remarks
   * - The `to` field is required and must have at least one recipient.
   * - CC recipients are visible in the email headers to all recipients.
   * - BCC recipients receive the email but are not visible to other recipients.
   * - The `content` field accepts HTML strings.
   * - Open and link tracking are always disabled.
   * - Recipients refused at intake are reported in `rejectedRecipients`
   *   instead of failing the send.
   */
  async send(params: SendParams): Promise<SendResult> {
    const toVec = mapToArray(params.to);
    const ccVec = mapToArray(params.cc);
    const bccVec = mapToArray(params.bcc);

    const allRecipients = [...toVec, ...ccVec, ...bccVec];

    const options: SendOptions = {
      attachments: params.attachments,
      headers: {
        cc: ccVec.length > 0 ? ccVec : undefined,
        to: toVec,
      },
      scheduledTime: params.scheduledTime,
      tracking: NO_TRACKING,
    };

    const result = await this.client.sendHtml(
      allRecipients,
      params.subject,
      params.content,
      options
    );

    return {
      acceptedCount: result.acceptedCount,
      messageId: result.messageId,
      rejectedCount: result.rejectedCount,
      rejectedRecipients: result.rejectedRecipients,
      scheduledTime: result.scheduledTime,
    };
  }
}
