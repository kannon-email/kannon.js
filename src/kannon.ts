import { createClient } from '@connectrpc/connect';
import { createGrpcTransport } from '@connectrpc/connect-node';
import { Mailer } from './proto/kannon/mailer/apiv1/mailerapiv1_connect.js';
import { Timestamp } from '@bufbuild/protobuf';
import { SendHTMLReq, SendTemplateReq, Attachment, SendRes } from './proto/kannon/mailer/apiv1/mailerapiv1_pb.js';
import { Sender } from './proto/kannon/mailer/types/send_pb.js';
import { Recipient, parseRecipent } from './recipient.js';

export class KannonCli {
  private readonly client: ReturnType<typeof createClient<typeof Mailer>>;
  private readonly token: string;

  constructor(domain: string, apiKey: string, private readonly sender: KannonSender, config: KannonConfig) {
    this.token = Buffer.from(`${domain}:${apiKey}`).toString('base64');

    const transport = createGrpcTransport({
      baseUrl: config.endpoint,
      httpVersion: '2',
      useBinaryFormat: true,
    });

    this.client = createClient(Mailer, transport);
  }

  async sendHtml(
    recipients: Recipient[],
    subject: string,
    html: string,
    options: SendOptions = {},
  ): Promise<KannonResult> {
    const request = new SendHTMLReq({
      html,
      sender: new Sender({
        email: this.sender.email,
        alias: this.sender.alias,
      }),
      subject: subject,
      recipients: recipients.map(parseRecipent),
      scheduledTime: options.scheduledTime ? Timestamp.fromDate(options.scheduledTime) : undefined,
      attachments: (options.attachments ?? []).map(
        (att) =>
          new Attachment({
            filename: att.filename,
            content: att.content,
          }),
      ),
      globalFields: options.globalFields ?? {},
    });

    const res = await this.client.sendHTML(request, {
      headers: {
        authorization: 'Basic ' + this.token,
      },
    });

    return parseResult(res);
  }

  async sendTemplate(
    recipients: Recipient[],
    subject: string,
    templateId: string,
    options: SendOptions = {},
  ): Promise<KannonResult> {
    const request = new SendTemplateReq({
      templateId,
      sender: new Sender({
        email: this.sender.email,
        alias: this.sender.alias,
      }),
      subject: subject,
      recipients: recipients.map(parseRecipent),
      scheduledTime: options.scheduledTime ? Timestamp.fromDate(options.scheduledTime) : undefined,
      attachments: (options.attachments ?? []).map(
        (att) =>
          new Attachment({
            filename: att.filename,
            content: att.content,
          }),
      ),
      globalFields: options.globalFields ?? {},
    });

    const res = await this.client.sendTemplate(request, {
      headers: {
        authorization: 'Basic ' + this.token,
      },
    });

    return parseResult(res);
  }
}

/**
 * Kannon client configuration.
 *
 * @property endpoint - The API endpoint URL, including protocol (e.g., "https://api.kannon.dev" or "http://localhost:8080").
 *                     Must include "http://" or "https://".
 */
export interface KannonConfig {
  /**
   * The API endpoint URL, including protocol (e.g., "https://api.kannon.dev" or "http://localhost:8080").
   * Must include "http://" or "https://".
   */
  endpoint: string;
  /**
   * @deprecated Use `endpoint` instead. This parameter will be removed in a future version.
   */
  host?: string;
}

export interface KannonSender {
  email: string;
  alias: string;
}

export type { Recipient };

export type SendOptions = {
  scheduledTime?: Date;
  globalFields?: Record<string, string>;
  attachments?: {
    filename: string;
    content: Buffer;
  }[];
};

export type KannonResult = {
  messageId: string;
  templateId: string;
  scheduledTime: Date;
};

function parseResult(result: SendRes): KannonResult {
  return {
    messageId: result.messageId,
    templateId: result.templateId,
    scheduledTime: result.scheduledTime ? result.scheduledTime.toDate() : new Date(),
  };
}
