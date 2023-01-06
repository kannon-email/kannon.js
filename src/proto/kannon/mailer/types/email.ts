/* eslint-disable */
import _m0 from 'protobufjs/minimal';

export const protobufPackage = 'pkg.kannon.mailer.types';

export interface EmailToSend {
  emailId: string;
  from: string;
  to: string;
  returnPath: string;
  body: Uint8Array;
  shouldRetry: boolean;
}

function createBaseEmailToSend(): EmailToSend {
  return { emailId: '', from: '', to: '', returnPath: '', body: new Uint8Array(), shouldRetry: false };
}

export const EmailToSend = {
  encode(message: EmailToSend, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.emailId !== '') {
      writer.uint32(10).string(message.emailId);
    }
    if (message.from !== '') {
      writer.uint32(18).string(message.from);
    }
    if (message.to !== '') {
      writer.uint32(26).string(message.to);
    }
    if (message.returnPath !== '') {
      writer.uint32(34).string(message.returnPath);
    }
    if (message.body.length !== 0) {
      writer.uint32(42).bytes(message.body);
    }
    if (message.shouldRetry === true) {
      writer.uint32(48).bool(message.shouldRetry);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): EmailToSend {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseEmailToSend();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.emailId = reader.string();
          break;
        case 2:
          message.from = reader.string();
          break;
        case 3:
          message.to = reader.string();
          break;
        case 4:
          message.returnPath = reader.string();
          break;
        case 5:
          message.body = reader.bytes();
          break;
        case 6:
          message.shouldRetry = reader.bool();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): EmailToSend {
    return {
      emailId: isSet(object.emailId) ? String(object.emailId) : '',
      from: isSet(object.from) ? String(object.from) : '',
      to: isSet(object.to) ? String(object.to) : '',
      returnPath: isSet(object.returnPath) ? String(object.returnPath) : '',
      body: isSet(object.body) ? bytesFromBase64(object.body) : new Uint8Array(),
      shouldRetry: isSet(object.shouldRetry) ? Boolean(object.shouldRetry) : false,
    };
  },

  toJSON(message: EmailToSend): unknown {
    const obj: any = {};
    message.emailId !== undefined && (obj.emailId = message.emailId);
    message.from !== undefined && (obj.from = message.from);
    message.to !== undefined && (obj.to = message.to);
    message.returnPath !== undefined && (obj.returnPath = message.returnPath);
    message.body !== undefined &&
      (obj.body = base64FromBytes(message.body !== undefined ? message.body : new Uint8Array()));
    message.shouldRetry !== undefined && (obj.shouldRetry = message.shouldRetry);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<EmailToSend>, I>>(object: I): EmailToSend {
    const message = createBaseEmailToSend();
    message.emailId = object.emailId ?? '';
    message.from = object.from ?? '';
    message.to = object.to ?? '';
    message.returnPath = object.returnPath ?? '';
    message.body = object.body ?? new Uint8Array();
    message.shouldRetry = object.shouldRetry ?? false;
    return message;
  },
};

declare var self: any | undefined;
declare var window: any | undefined;
declare var global: any | undefined;
var tsProtoGlobalThis: any = (() => {
  if (typeof globalThis !== 'undefined') {
    return globalThis;
  }
  if (typeof self !== 'undefined') {
    return self;
  }
  if (typeof window !== 'undefined') {
    return window;
  }
  if (typeof global !== 'undefined') {
    return global;
  }
  throw 'Unable to locate global object';
})();

function bytesFromBase64(b64: string): Uint8Array {
  if (tsProtoGlobalThis.Buffer) {
    return Uint8Array.from(tsProtoGlobalThis.Buffer.from(b64, 'base64'));
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
    return tsProtoGlobalThis.Buffer.from(arr).toString('base64');
  } else {
    const bin: string[] = [];
    arr.forEach((byte) => {
      bin.push(String.fromCharCode(byte));
    });
    return tsProtoGlobalThis.btoa(bin.join(''));
  }
}

type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;

export type DeepPartial<T> = T extends Builtin
  ? T
  : T extends Array<infer U>
  ? Array<DeepPartial<U>>
  : T extends ReadonlyArray<infer U>
  ? ReadonlyArray<DeepPartial<U>>
  : T extends {}
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin
  ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & { [K in Exclude<keyof I, KeysOfUnion<P>>]: never };

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
