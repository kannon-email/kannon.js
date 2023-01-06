import * as proto from './proto/kannon/mailer/apiv1/mailerapiv1';
import * as grpc from '@grpc/grpc-js';
import { Recipient } from './proto/kannon/mailer/types/send';
import { promisifyAll } from './utils/grpc-promisify';

export class KannonCli {
  private readonly client: promisifyAll<proto.MailerClient>;
  constructor(
    host: string,
    skipTLS: boolean,
    private readonly senderEmail: string,
    private readonly senderAlias: string,
    private readonly token: string,
  ) {
    const credentials = skipTLS ? grpc.credentials.createInsecure() : grpc.credentials.createSsl();
    this.client = promisifyAll(new proto.MailerClient(host, credentials));
  }

  async sendMail(recipients: Recipient[], subject: string, html: string, scheduledTime = new Date()) {
    return this.client.sendHtml(
      {
        html,
        sender: this.sender(),
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
        sender: this.sender(),
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

  private sender() {
    return {
      alias: this.senderAlias,
      email: this.senderEmail,
    };
  }
}
