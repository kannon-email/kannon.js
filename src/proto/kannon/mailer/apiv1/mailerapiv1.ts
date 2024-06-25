/* eslint-disable */
import {
  CallOptions,
  ChannelCredentials,
  Client,
  ClientOptions,
  ClientUnaryCall,
  handleUnaryCall,
  makeGenericClientConstructor,
  Metadata,
  ServiceError,
  UntypedServiceImplementation,
} from "@grpc/grpc-js";
import _m0 from "protobufjs/minimal";
import { Timestamp } from "../../../google/protobuf/timestamp";
import { Recipient, Sender } from "../types/send";

export const protobufPackage = "pkg.kannon.mailer.apiv1";

export interface Attachment {
  filename: string;
  content: Uint8Array;
}

export interface SendHTMLReq {
  sender: Sender | undefined;
  subject: string;
  html: string;
  scheduledTime?: Date | undefined;
  recipients: Recipient[];
  attachments: Attachment[];
  globalFields: { [key: string]: string };
}

export interface SendHTMLReq_GlobalFieldsEntry {
  key: string;
  value: string;
}

export interface SendTemplateReq {
  sender: Sender | undefined;
  subject: string;
  templateId: string;
  scheduledTime?: Date | undefined;
  recipients: Recipient[];
  attachments: Attachment[];
  globalFields: { [key: string]: string };
}

export interface SendTemplateReq_GlobalFieldsEntry {
  key: string;
  value: string;
}

export interface SendRes {
  messageId: string;
  templateId: string;
  scheduledTime: Date | undefined;
}

function createBaseAttachment(): Attachment {
  return { filename: "", content: new Uint8Array() };
}

export const Attachment = {
  encode(message: Attachment, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.filename !== "") {
      writer.uint32(10).string(message.filename);
    }
    if (message.content.length !== 0) {
      writer.uint32(18).bytes(message.content);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Attachment {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseAttachment();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.filename = reader.string();
          break;
        case 2:
          message.content = reader.bytes();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Attachment {
    return {
      filename: isSet(object.filename) ? String(object.filename) : "",
      content: isSet(object.content) ? bytesFromBase64(object.content) : new Uint8Array(),
    };
  },

  toJSON(message: Attachment): unknown {
    const obj: any = {};
    message.filename !== undefined && (obj.filename = message.filename);
    message.content !== undefined &&
      (obj.content = base64FromBytes(message.content !== undefined ? message.content : new Uint8Array()));
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<Attachment>, I>>(object: I): Attachment {
    const message = createBaseAttachment();
    message.filename = object.filename ?? "";
    message.content = object.content ?? new Uint8Array();
    return message;
  },
};

function createBaseSendHTMLReq(): SendHTMLReq {
  return {
    sender: undefined,
    subject: "",
    html: "",
    scheduledTime: undefined,
    recipients: [],
    attachments: [],
    globalFields: {},
  };
}

export const SendHTMLReq = {
  encode(message: SendHTMLReq, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.sender !== undefined) {
      Sender.encode(message.sender, writer.uint32(10).fork()).ldelim();
    }
    if (message.subject !== "") {
      writer.uint32(26).string(message.subject);
    }
    if (message.html !== "") {
      writer.uint32(34).string(message.html);
    }
    if (message.scheduledTime !== undefined) {
      Timestamp.encode(toTimestamp(message.scheduledTime), writer.uint32(42).fork()).ldelim();
    }
    for (const v of message.recipients) {
      Recipient.encode(v!, writer.uint32(50).fork()).ldelim();
    }
    for (const v of message.attachments) {
      Attachment.encode(v!, writer.uint32(58).fork()).ldelim();
    }
    Object.entries(message.globalFields).forEach(([key, value]) => {
      SendHTMLReq_GlobalFieldsEntry.encode({ key: key as any, value }, writer.uint32(66).fork()).ldelim();
    });
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SendHTMLReq {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSendHTMLReq();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.sender = Sender.decode(reader, reader.uint32());
          break;
        case 3:
          message.subject = reader.string();
          break;
        case 4:
          message.html = reader.string();
          break;
        case 5:
          message.scheduledTime = fromTimestamp(Timestamp.decode(reader, reader.uint32()));
          break;
        case 6:
          message.recipients.push(Recipient.decode(reader, reader.uint32()));
          break;
        case 7:
          message.attachments.push(Attachment.decode(reader, reader.uint32()));
          break;
        case 8:
          const entry8 = SendHTMLReq_GlobalFieldsEntry.decode(reader, reader.uint32());
          if (entry8.value !== undefined) {
            message.globalFields[entry8.key] = entry8.value;
          }
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): SendHTMLReq {
    return {
      sender: isSet(object.sender) ? Sender.fromJSON(object.sender) : undefined,
      subject: isSet(object.subject) ? String(object.subject) : "",
      html: isSet(object.html) ? String(object.html) : "",
      scheduledTime: isSet(object.scheduledTime) ? fromJsonTimestamp(object.scheduledTime) : undefined,
      recipients: Array.isArray(object?.recipients) ? object.recipients.map((e: any) => Recipient.fromJSON(e)) : [],
      attachments: Array.isArray(object?.attachments) ? object.attachments.map((e: any) => Attachment.fromJSON(e)) : [],
      globalFields: isObject(object.globalFields)
        ? Object.entries(object.globalFields).reduce<{ [key: string]: string }>((acc, [key, value]) => {
          acc[key] = String(value);
          return acc;
        }, {})
        : {},
    };
  },

  toJSON(message: SendHTMLReq): unknown {
    const obj: any = {};
    message.sender !== undefined && (obj.sender = message.sender ? Sender.toJSON(message.sender) : undefined);
    message.subject !== undefined && (obj.subject = message.subject);
    message.html !== undefined && (obj.html = message.html);
    message.scheduledTime !== undefined && (obj.scheduledTime = message.scheduledTime.toISOString());
    if (message.recipients) {
      obj.recipients = message.recipients.map((e) => e ? Recipient.toJSON(e) : undefined);
    } else {
      obj.recipients = [];
    }
    if (message.attachments) {
      obj.attachments = message.attachments.map((e) => e ? Attachment.toJSON(e) : undefined);
    } else {
      obj.attachments = [];
    }
    obj.globalFields = {};
    if (message.globalFields) {
      Object.entries(message.globalFields).forEach(([k, v]) => {
        obj.globalFields[k] = v;
      });
    }
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<SendHTMLReq>, I>>(object: I): SendHTMLReq {
    const message = createBaseSendHTMLReq();
    message.sender = (object.sender !== undefined && object.sender !== null)
      ? Sender.fromPartial(object.sender)
      : undefined;
    message.subject = object.subject ?? "";
    message.html = object.html ?? "";
    message.scheduledTime = object.scheduledTime ?? undefined;
    message.recipients = object.recipients?.map((e) => Recipient.fromPartial(e)) || [];
    message.attachments = object.attachments?.map((e) => Attachment.fromPartial(e)) || [];
    message.globalFields = Object.entries(object.globalFields ?? {}).reduce<{ [key: string]: string }>(
      (acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = String(value);
        }
        return acc;
      },
      {},
    );
    return message;
  },
};

function createBaseSendHTMLReq_GlobalFieldsEntry(): SendHTMLReq_GlobalFieldsEntry {
  return { key: "", value: "" };
}

export const SendHTMLReq_GlobalFieldsEntry = {
  encode(message: SendHTMLReq_GlobalFieldsEntry, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.key !== "") {
      writer.uint32(10).string(message.key);
    }
    if (message.value !== "") {
      writer.uint32(18).string(message.value);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SendHTMLReq_GlobalFieldsEntry {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSendHTMLReq_GlobalFieldsEntry();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.key = reader.string();
          break;
        case 2:
          message.value = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): SendHTMLReq_GlobalFieldsEntry {
    return { key: isSet(object.key) ? String(object.key) : "", value: isSet(object.value) ? String(object.value) : "" };
  },

  toJSON(message: SendHTMLReq_GlobalFieldsEntry): unknown {
    const obj: any = {};
    message.key !== undefined && (obj.key = message.key);
    message.value !== undefined && (obj.value = message.value);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<SendHTMLReq_GlobalFieldsEntry>, I>>(
    object: I,
  ): SendHTMLReq_GlobalFieldsEntry {
    const message = createBaseSendHTMLReq_GlobalFieldsEntry();
    message.key = object.key ?? "";
    message.value = object.value ?? "";
    return message;
  },
};

function createBaseSendTemplateReq(): SendTemplateReq {
  return {
    sender: undefined,
    subject: "",
    templateId: "",
    scheduledTime: undefined,
    recipients: [],
    attachments: [],
    globalFields: {},
  };
}

export const SendTemplateReq = {
  encode(message: SendTemplateReq, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.sender !== undefined) {
      Sender.encode(message.sender, writer.uint32(10).fork()).ldelim();
    }
    if (message.subject !== "") {
      writer.uint32(26).string(message.subject);
    }
    if (message.templateId !== "") {
      writer.uint32(34).string(message.templateId);
    }
    if (message.scheduledTime !== undefined) {
      Timestamp.encode(toTimestamp(message.scheduledTime), writer.uint32(42).fork()).ldelim();
    }
    for (const v of message.recipients) {
      Recipient.encode(v!, writer.uint32(50).fork()).ldelim();
    }
    for (const v of message.attachments) {
      Attachment.encode(v!, writer.uint32(58).fork()).ldelim();
    }
    Object.entries(message.globalFields).forEach(([key, value]) => {
      SendTemplateReq_GlobalFieldsEntry.encode({ key: key as any, value }, writer.uint32(66).fork()).ldelim();
    });
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SendTemplateReq {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSendTemplateReq();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.sender = Sender.decode(reader, reader.uint32());
          break;
        case 3:
          message.subject = reader.string();
          break;
        case 4:
          message.templateId = reader.string();
          break;
        case 5:
          message.scheduledTime = fromTimestamp(Timestamp.decode(reader, reader.uint32()));
          break;
        case 6:
          message.recipients.push(Recipient.decode(reader, reader.uint32()));
          break;
        case 7:
          message.attachments.push(Attachment.decode(reader, reader.uint32()));
          break;
        case 8:
          const entry8 = SendTemplateReq_GlobalFieldsEntry.decode(reader, reader.uint32());
          if (entry8.value !== undefined) {
            message.globalFields[entry8.key] = entry8.value;
          }
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): SendTemplateReq {
    return {
      sender: isSet(object.sender) ? Sender.fromJSON(object.sender) : undefined,
      subject: isSet(object.subject) ? String(object.subject) : "",
      templateId: isSet(object.templateId) ? String(object.templateId) : "",
      scheduledTime: isSet(object.scheduledTime) ? fromJsonTimestamp(object.scheduledTime) : undefined,
      recipients: Array.isArray(object?.recipients) ? object.recipients.map((e: any) => Recipient.fromJSON(e)) : [],
      attachments: Array.isArray(object?.attachments) ? object.attachments.map((e: any) => Attachment.fromJSON(e)) : [],
      globalFields: isObject(object.globalFields)
        ? Object.entries(object.globalFields).reduce<{ [key: string]: string }>((acc, [key, value]) => {
          acc[key] = String(value);
          return acc;
        }, {})
        : {},
    };
  },

  toJSON(message: SendTemplateReq): unknown {
    const obj: any = {};
    message.sender !== undefined && (obj.sender = message.sender ? Sender.toJSON(message.sender) : undefined);
    message.subject !== undefined && (obj.subject = message.subject);
    message.templateId !== undefined && (obj.templateId = message.templateId);
    message.scheduledTime !== undefined && (obj.scheduledTime = message.scheduledTime.toISOString());
    if (message.recipients) {
      obj.recipients = message.recipients.map((e) => e ? Recipient.toJSON(e) : undefined);
    } else {
      obj.recipients = [];
    }
    if (message.attachments) {
      obj.attachments = message.attachments.map((e) => e ? Attachment.toJSON(e) : undefined);
    } else {
      obj.attachments = [];
    }
    obj.globalFields = {};
    if (message.globalFields) {
      Object.entries(message.globalFields).forEach(([k, v]) => {
        obj.globalFields[k] = v;
      });
    }
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<SendTemplateReq>, I>>(object: I): SendTemplateReq {
    const message = createBaseSendTemplateReq();
    message.sender = (object.sender !== undefined && object.sender !== null)
      ? Sender.fromPartial(object.sender)
      : undefined;
    message.subject = object.subject ?? "";
    message.templateId = object.templateId ?? "";
    message.scheduledTime = object.scheduledTime ?? undefined;
    message.recipients = object.recipients?.map((e) => Recipient.fromPartial(e)) || [];
    message.attachments = object.attachments?.map((e) => Attachment.fromPartial(e)) || [];
    message.globalFields = Object.entries(object.globalFields ?? {}).reduce<{ [key: string]: string }>(
      (acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = String(value);
        }
        return acc;
      },
      {},
    );
    return message;
  },
};

function createBaseSendTemplateReq_GlobalFieldsEntry(): SendTemplateReq_GlobalFieldsEntry {
  return { key: "", value: "" };
}

export const SendTemplateReq_GlobalFieldsEntry = {
  encode(message: SendTemplateReq_GlobalFieldsEntry, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.key !== "") {
      writer.uint32(10).string(message.key);
    }
    if (message.value !== "") {
      writer.uint32(18).string(message.value);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SendTemplateReq_GlobalFieldsEntry {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSendTemplateReq_GlobalFieldsEntry();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.key = reader.string();
          break;
        case 2:
          message.value = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): SendTemplateReq_GlobalFieldsEntry {
    return { key: isSet(object.key) ? String(object.key) : "", value: isSet(object.value) ? String(object.value) : "" };
  },

  toJSON(message: SendTemplateReq_GlobalFieldsEntry): unknown {
    const obj: any = {};
    message.key !== undefined && (obj.key = message.key);
    message.value !== undefined && (obj.value = message.value);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<SendTemplateReq_GlobalFieldsEntry>, I>>(
    object: I,
  ): SendTemplateReq_GlobalFieldsEntry {
    const message = createBaseSendTemplateReq_GlobalFieldsEntry();
    message.key = object.key ?? "";
    message.value = object.value ?? "";
    return message;
  },
};

function createBaseSendRes(): SendRes {
  return { messageId: "", templateId: "", scheduledTime: undefined };
}

export const SendRes = {
  encode(message: SendRes, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.messageId !== "") {
      writer.uint32(10).string(message.messageId);
    }
    if (message.templateId !== "") {
      writer.uint32(18).string(message.templateId);
    }
    if (message.scheduledTime !== undefined) {
      Timestamp.encode(toTimestamp(message.scheduledTime), writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SendRes {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSendRes();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.messageId = reader.string();
          break;
        case 2:
          message.templateId = reader.string();
          break;
        case 3:
          message.scheduledTime = fromTimestamp(Timestamp.decode(reader, reader.uint32()));
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): SendRes {
    return {
      messageId: isSet(object.messageId) ? String(object.messageId) : "",
      templateId: isSet(object.templateId) ? String(object.templateId) : "",
      scheduledTime: isSet(object.scheduledTime) ? fromJsonTimestamp(object.scheduledTime) : undefined,
    };
  },

  toJSON(message: SendRes): unknown {
    const obj: any = {};
    message.messageId !== undefined && (obj.messageId = message.messageId);
    message.templateId !== undefined && (obj.templateId = message.templateId);
    message.scheduledTime !== undefined && (obj.scheduledTime = message.scheduledTime.toISOString());
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<SendRes>, I>>(object: I): SendRes {
    const message = createBaseSendRes();
    message.messageId = object.messageId ?? "";
    message.templateId = object.templateId ?? "";
    message.scheduledTime = object.scheduledTime ?? undefined;
    return message;
  },
};

export type MailerService = typeof MailerService;
export const MailerService = {
  sendHtml: {
    path: "/pkg.kannon.mailer.apiv1.Mailer/SendHTML",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: SendHTMLReq) => Buffer.from(SendHTMLReq.encode(value).finish()),
    requestDeserialize: (value: Buffer) => SendHTMLReq.decode(value),
    responseSerialize: (value: SendRes) => Buffer.from(SendRes.encode(value).finish()),
    responseDeserialize: (value: Buffer) => SendRes.decode(value),
  },
  sendTemplate: {
    path: "/pkg.kannon.mailer.apiv1.Mailer/SendTemplate",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: SendTemplateReq) => Buffer.from(SendTemplateReq.encode(value).finish()),
    requestDeserialize: (value: Buffer) => SendTemplateReq.decode(value),
    responseSerialize: (value: SendRes) => Buffer.from(SendRes.encode(value).finish()),
    responseDeserialize: (value: Buffer) => SendRes.decode(value),
  },
} as const;

export interface MailerServer extends UntypedServiceImplementation {
  sendHtml: handleUnaryCall<SendHTMLReq, SendRes>;
  sendTemplate: handleUnaryCall<SendTemplateReq, SendRes>;
}

export interface MailerClient extends Client {
  sendHtml(request: SendHTMLReq, callback: (error: ServiceError | null, response: SendRes) => void): ClientUnaryCall;
  sendHtml(
    request: SendHTMLReq,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: SendRes) => void,
  ): ClientUnaryCall;
  sendHtml(
    request: SendHTMLReq,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: SendRes) => void,
  ): ClientUnaryCall;
  sendTemplate(
    request: SendTemplateReq,
    callback: (error: ServiceError | null, response: SendRes) => void,
  ): ClientUnaryCall;
  sendTemplate(
    request: SendTemplateReq,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: SendRes) => void,
  ): ClientUnaryCall;
  sendTemplate(
    request: SendTemplateReq,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: SendRes) => void,
  ): ClientUnaryCall;
}

export const MailerClient = makeGenericClientConstructor(
  MailerService,
  "pkg.kannon.mailer.apiv1.Mailer",
) as unknown as {
  new (address: string, credentials: ChannelCredentials, options?: Partial<ClientOptions>): MailerClient;
  service: typeof MailerService;
};

declare var self: any | undefined;
declare var window: any | undefined;
declare var global: any | undefined;
var tsProtoGlobalThis: any = (() => {
  if (typeof globalThis !== "undefined") {
    return globalThis;
  }
  if (typeof self !== "undefined") {
    return self;
  }
  if (typeof window !== "undefined") {
    return window;
  }
  if (typeof global !== "undefined") {
    return global;
  }
  throw "Unable to locate global object";
})();

function bytesFromBase64(b64: string): Uint8Array {
  if (tsProtoGlobalThis.Buffer) {
    return Uint8Array.from(tsProtoGlobalThis.Buffer.from(b64, "base64"));
  } else {
    const bin = tsProtoGlobalThis.atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; ++i) {
      arr[i] = bin.charCodeAt(i);
    }
    return arr;
  }
}

function base64FromBytes(arr: Uint8Array): string {
  if (tsProtoGlobalThis.Buffer) {
    return tsProtoGlobalThis.Buffer.from(arr).toString("base64");
  } else {
    const bin: string[] = [];
    arr.forEach((byte) => {
      bin.push(String.fromCharCode(byte));
    });
    return tsProtoGlobalThis.btoa(bin.join(""));
  }
}

type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;

export type DeepPartial<T> = T extends Builtin ? T
  : T extends Array<infer U> ? Array<DeepPartial<U>> : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>>
  : T extends {} ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & { [K in Exclude<keyof I, KeysOfUnion<P>>]: never };

function toTimestamp(date: Date): Timestamp {
  const seconds = date.getTime() / 1_000;
  const nanos = (date.getTime() % 1_000) * 1_000_000;
  return { seconds, nanos };
}

function fromTimestamp(t: Timestamp): Date {
  let millis = t.seconds * 1_000;
  millis += t.nanos / 1_000_000;
  return new Date(millis);
}

function fromJsonTimestamp(o: any): Date {
  if (o instanceof Date) {
    return o;
  } else if (typeof o === "string") {
    return new Date(o);
  } else {
    return fromTimestamp(Timestamp.fromJSON(o));
  }
}

function isObject(value: any): boolean {
  return typeof value === "object" && value !== null;
}

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
