import { randomUUID } from "node:crypto";
import { errorFromResponse } from "./kannon-error.js";
import {
  type Recipient,
  type RecipientWire,
  toRecipientWire,
} from "./recipient.js";
import {
  type TrackingPolicy,
  type TrackingWire,
  toTrackingWire,
} from "./tracking.js";

const DEFAULT_ENDPOINT = "https://api.kannon.email/v1";
const TRAILING_SLASHES = /\/+$/u;

type ContentWire =
  | { html: string; type: "html" }
  | { template_id: string; type: "template" };

interface BatchCreateWire {
  attachments?: { content_base64: string; filename: string }[];
  content: ContentWire;
  from: { email: string; name?: string };
  global_fields?: Record<string, string>;
  headers?: { cc?: string[]; to?: string[] };
  one_click_unsubscribe?: { url_template: string };
  recipients: RecipientWire[];
  reply_to?: { email: string; name?: string };
  scheduled_at?: string;
  subject: string;
  tracking?: TrackingWire;
}

interface BatchReceiptWire {
  accepted_count: number;
  id: string;
  rejected_count: number;
  rejected_recipients?: { code: string; index: number }[];
  scheduled_at: string;
}

/**
 * Client of the Kannon REST API (v1), sending as one Domain with its API key.
 *
 * @example
 * ```typescript
 * const kannon = new KannonCli("example.com", apiKey, {
 *   alias: "Example",
 *   email: "news@example.com",
 * });
 * await kannon.sendHtml(["user@example.com"], "Hello", "<p>Hello!</p>");
 * ```
 */
export class KannonCli {
  private readonly apiKey: string;
  private readonly batchesUrl: string;
  private readonly fetch: typeof fetch;
  private readonly sender: KannonSender;

  constructor(
    domain: string,
    apiKey: string,
    sender: KannonSender,
    config: KannonConfig = {}
  ) {
    const endpoint = (config.endpoint ?? DEFAULT_ENDPOINT).replace(
      TRAILING_SLASHES,
      ""
    );
    this.apiKey = apiKey;
    this.batchesUrl = `${endpoint}/domains/${encodeURIComponent(domain)}/batches`;
    this.fetch = config.fetch ?? globalThis.fetch;
    this.sender = sender;
  }

  /**
   * Sends an HTML email to the given recipients as one Batch.
   *
   * @throws {KannonError} when the API refuses the request, including when
   * every recipient is refused (`no_recipients_accepted`).
   */
  sendHtml(
    recipients: Recipient[],
    subject: string,
    html: string,
    options: SendOptions = {}
  ): Promise<KannonResult> {
    return this.createBatch(
      recipients,
      subject,
      { html, type: "html" },
      options
    );
  }

  /**
   * Sends a stored Template to the given recipients as one Batch.
   *
   * @throws {KannonError} when the API refuses the request, including when
   * every recipient is refused (`no_recipients_accepted`).
   */
  sendTemplate(
    recipients: Recipient[],
    subject: string,
    templateId: string,
    options: SendOptions = {}
  ): Promise<KannonResult> {
    return this.createBatch(
      recipients,
      subject,
      { template_id: templateId, type: "template" },
      options
    );
  }

  private async createBatch(
    recipients: Recipient[],
    subject: string,
    content: ContentWire,
    options: SendOptions
  ): Promise<KannonResult> {
    const body = this.buildBatch(recipients, subject, content, options);
    const response = await this.fetch(this.batchesUrl, {
      body: JSON.stringify(body),
      headers: {
        Accept: "application/json, application/problem+json",
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": options.idempotencyKey ?? randomUUID(),
      },
      method: "POST",
    });

    if (!response.ok) {
      throw await errorFromResponse(response);
    }

    const receipt = (await response.json()) as BatchReceiptWire;
    return parseReceipt(receipt, body.recipients, response.status === 200);
  }

  private buildBatch(
    recipients: Recipient[],
    subject: string,
    content: ContentWire,
    options: SendOptions
  ): BatchCreateWire {
    const batch: BatchCreateWire = {
      content,
      from: { email: this.sender.email },
      recipients: recipients.map(toRecipientWire),
      subject,
    };
    if (this.sender.alias) {
      batch.from.name = this.sender.alias;
    }
    if (options.scheduledTime) {
      batch.scheduled_at = options.scheduledTime.toISOString();
    }
    if (options.globalFields && Object.keys(options.globalFields).length > 0) {
      batch.global_fields = options.globalFields;
    }
    if (options.attachments && options.attachments.length > 0) {
      batch.attachments = options.attachments.map((attachment) => ({
        content_base64: Buffer.from(attachment.content).toString("base64"),
        filename: attachment.filename,
      }));
    }
    if (options.headers) {
      batch.headers = options.headers;
    }
    const tracking = toTrackingWire(options.tracking);
    if (tracking) {
      batch.tracking = tracking;
    }
    if (options.oneClickUnsubscribe) {
      batch.one_click_unsubscribe = {
        url_template: options.oneClickUnsubscribe.urlTemplate,
      };
    }
    if (options.replyTo) {
      batch.reply_to = options.replyTo;
    }
    return batch;
  }
}

function parseReceipt(
  receipt: BatchReceiptWire,
  recipients: RecipientWire[],
  replayed: boolean
): KannonResult {
  return {
    acceptedCount: receipt.accepted_count,
    batchId: receipt.id,
    rejectedCount: receipt.rejected_count,
    rejectedRecipients: (receipt.rejected_recipients ?? []).map((rejected) => ({
      email: recipients[rejected.index]?.email ?? "",
      index: rejected.index,
      reason: rejected.code,
    })),
    replayed,
    scheduledTime: new Date(receipt.scheduled_at),
  };
}

/** Kannon client configuration. */
export interface KannonConfig {
  /**
   * Base URL of the REST API, version included. Defaults to
   * `https://api.kannon.email/v1`; for a self-hosted Kannon, point it at the
   * REST listener, e.g. `http://localhost:8081/v1`.
   */
  endpoint?: string;
  /** The fetch implementation to use. Defaults to the global `fetch`. */
  fetch?: typeof fetch;
}

export interface KannonSender {
  /** The display name shown in the From header. */
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
   * recipient's fields, plus `email`, which Kannon always supplies as the
   * recipient's address (`email` is reserved and cannot be overridden).
   * Substituted values are percent-encoded, so pass raw values rather than
   * pre-encoded ones.
   *
   * A template that is unparseable or not https fails the whole call. A
   * recipient whose fields leave a placeholder unresolved is rejected on its
   * own, with reason `unsubscribe_url_unresolved`.
   */
  urlTemplate: string;
}

/** Where replies should go, emitted as the Reply-To header. */
export interface ReplyTo {
  /** A bare address, not restricted to the sending domain. */
  email: string;
  name?: string;
}

export interface SendOptions {
  attachments?: {
    content: Uint8Array;
    filename: string;
  }[];
  /**
   * Fields shared by every recipient; a recipient's own fields win on
   * conflicts. `email` is reserved.
   */
  globalFields?: Record<string, string>;
  /** Display-only To and Cc headers: listed addresses receive nothing. */
  headers?: {
    cc?: string[];
    to?: string[];
  };
  /**
   * Makes the send safe to retry: a second call with the same key within 24
   * hours returns the original Batch (`replayed: true`) instead of creating a
   * new one. Defaults to a fresh random key per call, so pass your own and
   * reuse it when retrying.
   */
  idempotencyKey?: string;
  /**
   * Your own one-click unsubscribe endpoint, emitted on every delivery of this
   * batch. Kannon never adds one of its own.
   */
  oneClickUnsubscribe?: OneClickUnsubscribe;
  /** Emitted as Reply-To; when omitted, replies go to the sender. */
  replyTo?: ReplyTo;
  /** Schedules the batch; must be in the future. Omit to send now. */
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
  /** The address repeats an earlier recipient of the same batch. */
  | "duplicate_recipient"
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
  /** The recipient's fields leave a placeholder in the subject or body unresolved. */
  | "unresolved_placeholder"
  /** The recipient supplied a reserved field, such as `email`. */
  | "reserved_field"
  /** The personalised message for this recipient exceeds the size limit. */
  | "message_too_large"
  | (string & Record<never, never>);

/** One recipient refused at intake: no delivery was created for it. */
export interface RejectedRecipient {
  email: string;
  /** Zero-based position of the recipient in the request. */
  index: number;
  reason: RejectionReason;
}

export interface KannonResult {
  /** How many recipients were accepted and are queued for delivery. */
  acceptedCount: number;
  /** Identifier of the created Batch. */
  batchId: string;
  /** How many recipients were refused at intake. */
  rejectedCount: number;
  /**
   * Every recipient refused at intake, so you can reconcile what was actually
   * queued. Empty on a replay, whose original details are not retained.
   */
  rejectedRecipients: RejectedRecipient[];
  /**
   * True when the idempotency key matched an earlier send: no new Batch was
   * created and this is the original receipt.
   */
  replayed: boolean;
  scheduledTime: Date;
}
