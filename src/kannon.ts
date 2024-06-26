import * as grpc from '@grpc/grpc-js';
import * as proto from './proto/kannon/mailer/apiv1/mailerapiv1';
import { promisifyAll } from './utils/grpc-promisify';
import { Recipient, parseRecipent } from './recipent';

export class KannonCli {
  private readonly client: promisifyAll<proto.MailerClient>;
  private readonly token: string;
  constructor(
    domain: string,
    apiKey: string,
    private readonly sender: KannonSender,
    { host, skipTLS = false }: KannonConfig,
  ) {
    this.token = Buffer.from(`${domain}:${apiKey}`).toString('base64');
    const credentials = skipTLS ? grpc.credentials.createInsecure() : grpc.credentials.createSsl();
    this.client = promisifyAll(new proto.MailerClient(host, credentials));
  }

  async sendHtml(recipients: Recipient[], subject: string, html: string, options: SendOptions = {}) {
    return this.client.sendHtml(
      {
        html,
        sender: this.sender,
        subject: subject,
        recipients: recipients.map(parseRecipent),
        scheduledTime: options.scheduledTime ?? new Date(),
        attachments: options.attachments ?? [],
        globalFields: options.globalFields ?? {},
      },
      this.meta(),
    );
  }

  async sendTemplate(recipients: Recipient[], subject: string, templateId: string, options: SendOptions = {}) {
    return this.client.sendTemplate(
      {
        templateId,
        sender: this.sender,
        subject: subject,
        recipients: recipients.map(parseRecipent),
        scheduledTime: options.scheduledTime ?? new Date(),
        attachments: options.attachments ?? [],
        globalFields: options.globalFields ?? {},
      },
      this.meta(),
    );
  }

  private meta() {
    const meta = new grpc.Metadata();
    meta.add('authorization', 'Basic ' + this.token);
    return meta;
  }
}

export interface KannonConfig {
  host: string;
  skipTLS?: boolean;
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
