import * as proto from './proto/kannon/mailer/apiv1/mailerapiv1';
import * as grpc from '@grpc/grpc-js';
import { Recipient } from './proto/kannon/mailer/types/send';
import { promisifyAll } from './utils/grpc-promisify';

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

  async sendMail(recipients: Recipient[], subject: string, html: string, scheduledTime = new Date()) {
    return this.client.sendHtml(
      {
        html,
        sender: this.sender,
        subject: subject,
        scheduledTime,
        recipients,
      },
      this.meta(),
    );
  }

  async sendMailTemplate(recipients: Recipient[], subject: string, templateId: string, scheduledTime = new Date()) {
    return this.client.sendTemplate(
      {
        templateId,
        sender: this.sender,
        subject: subject,
        scheduledTime,
        recipients,
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
