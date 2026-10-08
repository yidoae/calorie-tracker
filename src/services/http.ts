import type { z } from "zod";
import { apiErrorSchema } from "@/types/api";

/*
 * The one place the browser talks HTTP. Every service call goes through `request`, which turns
 * network failures, error responses and malformed payloads into an `ApiError` with a Turkish
 * message the UI can show directly, and validates successful payloads against a schema.
 */

export class ApiError extends Error {
  constructor(
    message: string,
    /** HTTP status, or 0 when the server couldn't be reached. */
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const FALLBACK_BY_STATUS: Record<number, string> = {
  401: "Devam etmek için giriş yapın.",
  404: "İstenen kayıt bulunamadı.",
  429: "Çok fazla istek gönderildi. Biraz bekleyip tekrar dene.",
};

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Sent as JSON. */
  json?: unknown;
  /** Sent as multipart form data. */
  form?: FormData;
}

async function send(url: string, options: RequestOptions): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: options.method ?? (options.json !== undefined || options.form ? "POST" : "GET"),
      headers: options.json !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: options.json !== undefined ? JSON.stringify(options.json) : options.form,
      cache: "no-store",
    });
  } catch {
    throw new ApiError("Sunucuya ulaşılamadı. Bağlantını kontrol et.", 0);
  }

  if (!res.ok) {
    const body = apiErrorSchema.safeParse(await res.json().catch(() => null));
    throw new ApiError(body.data?.error ?? FALLBACK_BY_STATUS[res.status] ?? "Bir şeyler ters gitti. Tekrar dene.", res.status);
  }
  return res;
}

export async function request<T>(url: string, schema: z.ZodType<T> | null, options: RequestOptions = {}): Promise<T> {
  const res = await send(url, options);
  if (!schema || res.status === 204) return undefined as T;

  const parsed = schema.safeParse(await res.json().catch(() => undefined));
  if (!parsed.success) {
    console.error(`Unexpected response from ${url}:`, parsed.error.issues);
    throw new ApiError("Sunucudan beklenmeyen bir yanıt geldi.", res.status);
  }
  return parsed.data;
}

/**
 * A streamed NDJSON response: calls `onEvent` with each line, validated against `schema`, as it
 * arrives. Errors before the stream starts are thrown like `request`'s.
 */
export async function requestStream<T>(url: string, schema: z.ZodType<T>, options: RequestOptions, onEvent: (event: T) => void): Promise<void> {
  const res = await send(url, options);
  if (!res.body) throw new ApiError("Sunucudan beklenmeyen bir yanıt geldi.", res.status);
  const emit = (line: string) => {
    if (!line.trim()) return;
    let json: unknown;
    try {
      json = JSON.parse(line);
    } catch {
      json = undefined;
    }
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      console.error(`Unexpected stream line from ${url}:`, line);
      throw new ApiError("Sunucudan beklenmeyen bir yanıt geldi.", res.status);
    }
    onEvent(parsed.data);
  };
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    let chunk: ReadableStreamReadResult<string>;
    try {
      chunk = await reader.read();
    } catch {
      throw new ApiError("Bağlantı yanıt gelirken koptu. Tekrar dene.", 0);
    }
    if (chunk.done) break;
    buffer += chunk.value;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    lines.forEach(emit);
  }
  emit(buffer);
}

/** A file download: the body as a Blob plus the server's suggested filename. */
export async function requestFile(url: string, fallbackName: string): Promise<{ blob: Blob; filename: string }> {
  const res = await send(url, {});
  const match = /filename="([^"]+)"/.exec(res.headers.get("content-disposition") ?? "");
  return { blob: await res.blob(), filename: match?.[1] ?? fallbackName };
}

/** A message for any thrown value, for toasts and alerts. */
export function errorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : "Bir şeyler ters gitti. Tekrar dene.";
}
