/* eslint-disable */
import _m0 from "protobufjs/minimal";

export const protobufPackage = "pkg.kannon.mailer.types";

export interface Sender {
  email: string;
  alias: string;
}

export interface Recipient {
  email: string;
  fields: { [key: string]: string };
}

export interface Recipient_FieldsEntry {
  key: string;
  value: string;
}

function createBaseSender(): Sender {
  return { email: "", alias: "" };
}

export const Sender = {
  encode(message: Sender, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.email !== "") {
      writer.uint32(10).string(message.email);
    }
    if (message.alias !== "") {
      writer.uint32(18).string(message.alias);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Sender {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSender();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.email = reader.string();
          break;
        case 2:
          message.alias = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Sender {
    return {
      email: isSet(object.email) ? String(object.email) : "",
      alias: isSet(object.alias) ? String(object.alias) : "",
    };
  },

  toJSON(message: Sender): unknown {
    const obj: any = {};
    message.email !== undefined && (obj.email = message.email);
    message.alias !== undefined && (obj.alias = message.alias);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<Sender>, I>>(object: I): Sender {
    const message = createBaseSender();
    message.email = object.email ?? "";
    message.alias = object.alias ?? "";
    return message;
  },
};

function createBaseRecipient(): Recipient {
  return { email: "", fields: {} };
}

export const Recipient = {
  encode(message: Recipient, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.email !== "") {
      writer.uint32(10).string(message.email);
    }
    Object.entries(message.fields).forEach(([key, value]) => {
      Recipient_FieldsEntry.encode({ key: key as any, value }, writer.uint32(18).fork()).ldelim();
    });
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Recipient {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseRecipient();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.email = reader.string();
          break;
        case 2:
          const entry2 = Recipient_FieldsEntry.decode(reader, reader.uint32());
          if (entry2.value !== undefined) {
            message.fields[entry2.key] = entry2.value;
          }
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Recipient {
    return {
      email: isSet(object.email) ? String(object.email) : "",
      fields: isObject(object.fields)
        ? Object.entries(object.fields).reduce<{ [key: string]: string }>((acc, [key, value]) => {
          acc[key] = String(value);
          return acc;
        }, {})
        : {},
    };
  },

  toJSON(message: Recipient): unknown {
    const obj: any = {};
    message.email !== undefined && (obj.email = message.email);
    obj.fields = {};
    if (message.fields) {
      Object.entries(message.fields).forEach(([k, v]) => {
        obj.fields[k] = v;
      });
    }
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<Recipient>, I>>(object: I): Recipient {
    const message = createBaseRecipient();
    message.email = object.email ?? "";
    message.fields = Object.entries(object.fields ?? {}).reduce<{ [key: string]: string }>((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = String(value);
      }
      return acc;
    }, {});
    return message;
  },
};

function createBaseRecipient_FieldsEntry(): Recipient_FieldsEntry {
  return { key: "", value: "" };
}

export const Recipient_FieldsEntry = {
  encode(message: Recipient_FieldsEntry, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.key !== "") {
      writer.uint32(10).string(message.key);
    }
    if (message.value !== "") {
      writer.uint32(18).string(message.value);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Recipient_FieldsEntry {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseRecipient_FieldsEntry();
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

  fromJSON(object: any): Recipient_FieldsEntry {
    return { key: isSet(object.key) ? String(object.key) : "", value: isSet(object.value) ? String(object.value) : "" };
  },

  toJSON(message: Recipient_FieldsEntry): unknown {
    const obj: any = {};
    message.key !== undefined && (obj.key = message.key);
    message.value !== undefined && (obj.value = message.value);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<Recipient_FieldsEntry>, I>>(object: I): Recipient_FieldsEntry {
    const message = createBaseRecipient_FieldsEntry();
    message.key = object.key ?? "";
    message.value = object.value ?? "";
    return message;
  },
};

type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;

export type DeepPartial<T> = T extends Builtin ? T
  : T extends Array<infer U> ? Array<DeepPartial<U>> : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>>
  : T extends {} ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & { [K in Exclude<keyof I, KeysOfUnion<P>>]: never };

function isObject(value: any): boolean {
  return typeof value === "object" && value !== null;
}

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
