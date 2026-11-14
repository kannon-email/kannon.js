/** One field-level problem reported by the API, located by a JSON pointer. */
export interface KannonFieldError {
  code: string;
  detail: string;
  /** JSON pointer into the request, e.g. `/recipients/2/email`. */
  pointer: string;
}

interface KannonErrorInit {
  code: string;
  detail?: string;
  errors?: KannonFieldError[];
  requestId?: string;
  retryAfter?: number;
  status: number;
  title: string;
}

/**
 * A request refused by the Kannon API, carrying its RFC 9457 Problem Details.
 *
 * `code` is a stable, machine-readable token safe to branch on, e.g.
 * `no_recipients_accepted`, `validation_failed`, `unauthenticated` or
 * `rate_limited`. `http_error` means the response carried no Problem Details.
 */
export class KannonError extends Error {
  readonly code: string;
  readonly detail?: string;
  readonly errors: KannonFieldError[];
  readonly requestId?: string;
  /** Seconds to wait before retrying, when the API states it. */
  readonly retryAfter?: number;
  readonly status: number;
  readonly title: string;

  constructor(init: KannonErrorInit) {
    super(
      `Kannon API error ${init.status} ${init.code}${init.detail ? `: ${init.detail}` : ""}`
    );
    this.name = "KannonError";
    this.code = init.code;
    this.detail = init.detail;
    this.errors = init.errors ?? [];
    this.requestId = init.requestId;
    this.retryAfter = init.retryAfter;
    this.status = init.status;
    this.title = init.title;
  }
}

interface ProblemWire {
  code?: unknown;
  detail?: unknown;
  errors?: unknown;
  request_id?: unknown;
  title?: unknown;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function parseFieldErrors(value: unknown): KannonFieldError[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null
    )
    .map((item) => ({
      code: asString(item.code) ?? "",
      detail: asString(item.detail) ?? "",
      pointer: asString(item.pointer) ?? "",
    }));
}

function parseRetryAfter(header: string | null): number | undefined {
  if (!header) {
    return;
  }
  const seconds = Number(header);
  return Number.isFinite(seconds) ? seconds : undefined;
}

export async function errorFromResponse(
  response: Response
): Promise<KannonError> {
  const text = await response.text();
  let problem: ProblemWire = {};
  try {
    const parsed: unknown = JSON.parse(text);
    if (parsed && typeof parsed === "object") {
      problem = parsed as ProblemWire;
    }
  } catch {
    problem = {};
  }
  return new KannonError({
    code: asString(problem.code) ?? "http_error",
    detail: asString(problem.detail),
    errors: parseFieldErrors(problem.errors),
    requestId:
      asString(problem.request_id) ??
      response.headers.get("X-Request-ID") ??
      undefined,
    retryAfter: parseRetryAfter(response.headers.get("Retry-After")),
    status: response.status,
    title: asString(problem.title) ?? response.statusText,
  });
}
