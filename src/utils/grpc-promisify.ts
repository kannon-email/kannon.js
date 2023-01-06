import * as grpc from '@grpc/grpc-js';

type CbFun<Req, Res> = (
  req: Req,
  metadata: grpc.Metadata,
  options: Partial<grpc.CallOptions>,
  callback: (error: any, response: Res) => void,
) => void;

type AsyncFun<Req, Res> = (req: Req, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>) => Promise<Res>;

type promisify<CB> = CB extends CbFun<infer Req, infer Res> ? AsyncFun<Req, Res> : never;

export type promisifyAll<Cli extends grpc.Client> = {
  [k in keyof Cli]: promisify<Cli[k]>;
};

function promisify<Req, Res>(cb: CbFun<Req, Res>): promisify<CbFun<Req, Res>> {
  return (req: Req, metadata: grpc.Metadata = new grpc.Metadata(), options: Partial<grpc.CallOptions> = {}) =>
    new Promise<Res>((resolve, reject) => {
      cb(req, metadata, options, (err, res) => {
        if (!!err) {
          return reject(err);
        }
        return resolve(res);
      });
    });
}

export function promisifyAll<TClient extends grpc.Client>(client: TClient): promisifyAll<TClient> {
  const methods = Object.getPrototypeOf(client);

  const res: { [k: string]: AsyncFun<any, unknown> } = {};
  for (const [name, method] of Object.entries(methods)) {
    res[name] = promisify<any, unknown>((method as any).bind(client));
  }

  return res as promisifyAll<TClient>;
}

export function CreateClientContructor<TClient extends grpc.Client>(Cli: ITCli<TClient>) {
  return (conf: GrpcClientConfig) => {
    const credentials = conf.skipTLS ? grpc.credentials.createInsecure() : grpc.credentials.createSsl();

    const cli = new Cli(conf.host, credentials);
    return promisifyAll(cli);
  };
}

interface ITCli<TClient extends grpc.Client> {
  new (address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ChannelOptions>): TClient;
}

export interface GrpcClientConfig {
  host: string;
  skipTLS: boolean;
}
