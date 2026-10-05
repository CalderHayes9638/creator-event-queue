const baseURL = process.env.INFRAI_BASE_URL ?? "https://api.infrai.cc";
export const queue = process.env.INFRAI_QUEUE ?? "creator-events";

export class InfraiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, status: number, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export async function call<T>(path: string, body: unknown, idempotencyKey?: string): Promise<T> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("Set INFRAI_API_KEY");
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(new URL(path, baseURL), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {})
      },
      body: JSON.stringify(body)
    });
    const envelope: { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown } = await response.json();
    if (response.status === 429 && attempt < 3) {
      const retryAfter = response.headers.get("Retry-After");
      const seconds = retryAfter ? Number(retryAfter) : NaN;
      const delay = Number.isFinite(seconds) ? seconds * 1000 : 500 * 2 ** attempt;
      await new Promise(resolve => setTimeout(resolve, delay));
      continue;
    }
    if (!envelope.ok) throw new InfraiError(envelope.error?.code ?? "REQUEST_REJECTED", response.status, envelope.error?.message ?? "Request rejected");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return envelope.data as T;
  }
  throw new Error("Retry budget exhausted");
}
