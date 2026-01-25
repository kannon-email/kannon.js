// biome-ignore lint/performance/noBarrelFile: This is the main entry point
export {
  KannonCli,
  type KannonConfig,
  type KannonResult,
  type KannonSender,
  type SendOptions,
} from "./kannon.js";
export {
  type Attachment,
  MailSender,
  type SendParams,
  type SendResult,
} from "./mail-sender.js";
