import { create } from "@bufbuild/protobuf";
import { timestampDate, timestampFromDate } from "@bufbuild/protobuf/wkt";
import { createClient } from "@connectrpc/connect";
import { createGrpcTransport } from "@connectrpc/connect-node";
import {
  AttachmentSchema,
  Mailer,
  SendHTMLReqSchema,
  type SendRes,
  SendTemplateReqSchema,
} from "./proto/kannon/mailer/apiv1/mailerapiv1_pb.js";
import { SenderSchema } from "./proto/kannon/mailer/types/send_pb.js";
import { parseRecipient, type Recipient } from "./recipient.js";

export class KannonCli {
  private readonly client: ReturnType<typeof createClient<typeof Mailer>>;
  private readonly token: string;
  private readonly sender: KannonSender;

  constructor(
    domain: string,
    apiKey: string,
    sender: KannonSender,
    config: KannonConfig
  ) {
    this.token = Buffer.from(`${domain}:${apiKey}`).toString("base64");
    this.sender = sender;

    const transport = createGrpcTransport({
      baseUrl: config.endpoint,
      useBinaryFormat: true,
    });

    this.client = createClient(Mailer, transport);
  }

  async sendHtml(
    recipients: Recipient[],
    subject: string,
    html: string,
    options: SendOptions = {}
  ): Promise<KannonResult> {
    const request = create(SendHTMLReqSchema, {
      html,
      sender: create(SenderSchema, {
        email: this.sender.email,
        alias: this.sender.alias,
      }),
      subject,
      recipients: recipients.map(parseRecipient),
      scheduledTime: options.scheduledTime
        ? timestampFromDate(options.scheduledTime)
        : undefined,
      attachments: (options.attachments ?? []).map((att) =>
        create(AttachmentSchema, {
          filename: att.filename,
          content: att.content,
        })
      ),
      globalFields: options.globalFields ?? {},
    });

    const res = await this.client.sendHTML(request, {
      headers: {
        authorization: `Basic ${this.token}`,
      },
    });

    return parseResult(res);
  }

  async sendTemplate(
    recipients: Recipient[],
    subject: string,
    templateId: string,
    options: SendOptions = {}
  ): Promise<KannonResult> {
    const request = create(SendTemplateReqSchema, {
      templateId,
      sender: create(SenderSchema, {
        email: this.sender.email,
        alias: this.sender.alias,
      }),
      subject,
      recipients: recipients.map(parseRecipient),
      scheduledTime: options.scheduledTime
        ? timestampFromDate(options.scheduledTime)
        : undefined,
      attachments: (options.attachments ?? []).map((att) =>
        create(AttachmentSchema, {
          filename: att.filename,
          content: att.content,
        })
      ),
      globalFields: options.globalFields ?? {},
    });

    const res = await this.client.sendTemplate(request, {
      headers: {
        authorization: `Basic ${this.token}`,
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

export interface SendOptions {
  scheduledTime?: Date;
  globalFields?: Record<string, string>;
  attachments?: {
    filename: string;
    content: Buffer;
  }[];
}

export interface KannonResult {
  messageId: string;
  templateId: string;
  scheduledTime: Date;
}

function parseResult(result: SendRes): KannonResult {
  return {
    messageId: result.messageId,
    templateId: result.templateId,
    scheduledTime: result.scheduledTime
      ? timestampDate(result.scheduledTime)
      : new Date(),
  };
}
