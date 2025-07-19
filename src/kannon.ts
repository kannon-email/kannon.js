import { createClient } from '@connectrpc/connect';
import { createGrpcTransport } from '@connectrpc/connect-node';
import { Mailer } from './proto/kannon/mailer/apiv1/mailerapiv1_connect.js';
import { Timestamp } from '@bufbuild/protobuf';
import { SendHTMLReq, SendTemplateReq, Attachment } from './proto/kannon/mailer/apiv1/mailerapiv1_pb.js';
import { Sender } from './proto/kannon/mailer/types/send_pb.js';
import { Recipient, parseRecipent } from './recipent.js';

export class KannonCli {
  private readonly client: ReturnType<typeof createClient<typeof Mailer>>;
  private readonly token: string;

  constructor(domain: string, apiKey: string, private readonly sender: KannonSender, { host }: KannonConfig) {
    this.token = Buffer.from(`${domain}:${apiKey}`).toString('base64');

    const transport = createGrpcTransport({
      baseUrl: parseHost(host),
      httpVersion: '2',
      useBinaryFormat: true,
    });

    this.client = createClient(Mailer, transport);
  }

  async sendHtml(recipients: Recipient[], subject: string, html: string, options: SendOptions = {}) {
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

    return this.client.sendHTML(request, {
      headers: {
        authorization: 'Basic ' + this.token,
      },
    });
  }

  async sendTemplate(recipients: Recipient[], subject: string, templateId: string, options: SendOptions = {}) {
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

    return this.client.sendTemplate(request, {
      headers: {
        authorization: 'Basic ' + this.token,
      },
    });
  }
}

export interface KannonConfig {
  host: string;
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

function parseHost(host: string) {
  if (/^https?:\/\//.test(host)) {
    return host;
  }
  return `https://${host}`;
}
