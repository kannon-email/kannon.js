import type { KannonResult, SendOptions } from "./kannon.js";
import type { Recipient } from "./recipient.js";

/**
 * Email attachment.
 */
export interface Attachment {
  /** The filename that will appear in the email. */
  filename: string;
  /** The file content as a Buffer. */
  content: Buffer;
}

/**
 * Result returned after sending an email.
 */
export interface SendResult {
  /** Unique identifier for the sent message. */
  messageId: string;
  /** The scheduled delivery time, if the email was scheduled. */
  scheduledTime?: Date;
}

/**
 * Parameters for sending an email.
 */
export interface SendParams {
  /** Primary recipient(s). Can be a single email address or an array of addresses. */
  to: string | string[];
  /** Email subject line. */
  subject: string;
  /** Email body content as HTML. */
  content: string;
  /** Carbon copy recipient(s). Visible to all recipients. */
  cc?: string | string[];
  /** Blind carbon copy recipient(s). Hidden from other recipients. */
  bcc?: string | string[];
  /** File attachments to include with the email. */
  attachments?: Attachment[];
  /** Schedule the email for future delivery. If not provided, sends immediately. */
  scheduledTime?: Date;
}

interface MailClient {
  sendHtml(
    recipients: Recipient[],
    subject: string,
    html: string,
    options?: SendOptions
  ): Promise<KannonResult>;
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
   */
  async send(params: SendParams): Promise<SendResult> {
    const toVec = mapToArray(params.to);
    const ccVec = mapToArray(params.cc);
    const bccVec = mapToArray(params.bcc);

    const allRecipients = [...toVec, ...ccVec, ...bccVec];

    const options: SendOptions = {
      attachments: params.attachments,
      scheduledTime: params.scheduledTime,
      headers: {
        to: toVec,
        cc: ccVec.length > 0 ? ccVec : undefined,
      },
    };

    const result = await this.client.sendHtml(
      allRecipients,
      params.subject,
      params.content,
      options
    );

    return {
      messageId: result.messageId,
      scheduledTime: result.scheduledTime,
    };
  }
}
