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
import {
  HeadersSchema,
  OneClickUnsubscribeSchema,
  SenderSchema,
} from "./proto/kannon/mailer/types/send_pb.js";
import { parseRecipient, type Recipient } from "./recipient.js";
import { parseTrackingPolicy, type TrackingPolicy } from "./tracking.js";

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
      ...this.buildSendRequest(recipients, subject, options),
      html,
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
      ...this.buildSendRequest(recipients, subject, options),
      templateId,
    });

    const res = await this.client.sendTemplate(request, {
      headers: {
        authorization: `Basic ${this.token}`,
      },
    });

    return parseResult(res);
  }

  /** Builds the fields shared by `SendHTMLReq` and `SendTemplateReq`. */
  private buildSendRequest(
    recipients: Recipient[],
    subject: string,
    options: SendOptions
  ) {
    return {
      attachments: (options.attachments ?? []).map((att) =>
        create(AttachmentSchema, {
          content: att.content,
          filename: att.filename,
        })
      ),
      globalFields: options.globalFields ?? {},
      headers: options.headers
        ? create(HeadersSchema, {
            cc: options.headers.cc ?? [],
            to: options.headers.to ?? [],
          })
        : undefined,
      oneClickUnsubscribe: options.oneClickUnsubscribe
        ? create(OneClickUnsubscribeSchema, {
            urlTemplate: options.oneClickUnsubscribe.urlTemplate,
          })
        : undefined,
      recipients: recipients.map(parseRecipient),
      scheduledTime: options.scheduledTime
        ? timestampFromDate(options.scheduledTime)
        : undefined,
      sender: create(SenderSchema, {
        alias: this.sender.alias,
        email: this.sender.email,
      }),
      subject,
      tracking: parseTrackingPolicy(options.tracking),
    };
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
  alias: string;
  email: string;
}

/**
 * Your own one-click unsubscribe endpoint, carried in the `List-Unsubscribe`
 * and `List-Unsubscribe-Post` headers (RFC 8058).
 *
 * Kannon personalises, emits and DKIM-signs it, and does nothing else with it:
 * it never calls the endpoint, keeps no suppression list, and records no
 * engagement when a recipient uses it.
 */
export interface OneClickUnsubscribe {
  /**
   * The https URL of the endpoint, as a template.
   *
   * The endpoint must accept `POST` with body `List-Unsubscribe=One-Click` and
   * unsubscribe the recipient with no further confirmation.
   *
   * `{{ field }}` placeholders are substituted per delivery from the
   * recipient's fields, plus `email`, which Kannon supplies as the recipient's
   * address unless you pass a field of that name yourself. Substituted values
   * are percent-encoded, so pass raw values rather than pre-encoded ones.
   *
   * A template that is unparseable or not https fails the whole call. A
   * recipient whose fields leave a placeholder unresolved is rejected on its
   * own, with reason `unsubscribe_url_unresolved`.
   */
  urlTemplate: string;
}

export interface SendOptions {
  attachments?: {
    content: Buffer;
    filename: string;
  }[];
  globalFields?: Record<string, string>;
  headers?: {
    cc?: string[];
    to?: string[];
  };
  /**
   * Your own one-click unsubscribe endpoint, emitted on every delivery of this
   * batch. Kannon never adds one of its own.
   */
  oneClickUnsubscribe?: OneClickUnsubscribe;
  scheduledTime?: Date;
  /**
   * The tracking policy for this batch.
   *
   * Omitted states nothing and resolves to the domain ceiling configured on the
   * server. A mode above that ceiling fails the call.
   */
  tracking?: TrackingPolicy;
}

/**
 * Why a recipient was refused at intake.
 *
 * A stable, machine-readable token. Treat an unrecognised value as a refusal of
 * unknown cause: the set grows as new causes are added.
 */
export type RejectionReason =
  /** The address is empty or otherwise unusable. */
  | "invalid_email"
  /**
   * The recipient's tracking policy asks for more than its domain allows;
   * consent may narrow what is collected, never widen it.
   */
  | "tracking_above_ceiling"
  /**
   * The recipient stated a tracking mode the server will not act on — the
   * reserved `pseudonymous`, or a value from a newer schema.
   */
  | "unsupported_tracking_mode"
  /**
   * The recipient's fields leave a placeholder in the one-click unsubscribe
   * URL template unresolved.
   */
  | "unsubscribe_url_unresolved"
  | (string & Record<never, never>);

/** One recipient refused at intake: no delivery was created for it. */
export interface RejectedRecipient {
  email: string;
  reason: RejectionReason;
}

export interface KannonResult {
  /** How many recipients were accepted and are queued for delivery. */
  acceptedCount: number;
  messageId: string;
  /**
   * How many recipients were refused at intake. Equals the length of
   * `rejectedRecipients`, and is zero for a send in which nothing was refused.
   */
  rejectedCount: number;
  /**
   * Every recipient refused at intake, so you can reconcile what was actually
   * queued without polling stats. A send in which every recipient is refused
   * still resolves, with `acceptedCount` zero and every refusal listed.
   */
  rejectedRecipients: RejectedRecipient[];
  scheduledTime: Date;
  templateId: string;
}

function parseResult(result: SendRes): KannonResult {
  return {
    acceptedCount: result.acceptedCount,
    messageId: result.messageId,
    rejectedCount: result.rejectedCount,
    rejectedRecipients: result.rejectedRecipients.map((rejected) => ({
      email: rejected.email,
      reason: rejected.reason,
    })),
    scheduledTime: result.scheduledTime
      ? timestampDate(result.scheduledTime)
      : new Date(),
    templateId: result.templateId,
  };
}
