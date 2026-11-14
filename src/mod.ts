export {
  KannonCli,
  type KannonConfig,
  type KannonResult,
  type KannonSender,
  type OneClickUnsubscribe,
  type RejectedRecipient,
  type RejectionReason,
  type ReplyTo,
  type SendOptions,
} from "./kannon.js";
export { KannonError, type KannonFieldError } from "./kannon-error.js";
export {
  type Attachment,
  MailSender,
  type SendParams,
  type SendResult,
} from "./mail-sender.js";
export type { Recipient } from "./recipient.js";
export type { TrackingMode, TrackingPolicy } from "./tracking.js";
