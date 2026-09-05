import { env } from "@/lib/env";
import { API_PREFIX } from "@/lib/constants";
import { authStorage } from "@/lib/auth";

export class ApiError extends Error {
  status: number;
  detail: unknown;

  constructor(status: number, detail: unknown) {
    super(typeof detail === "string" ? detail : "Request failed");
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

type NextFetchRequestConfig = {
  revalidate?: number | false;
  tags?: string[];
};

export type ApiRequestOptions = {
  auth?: boolean;
  token?: string;
  signal?: AbortSignal;
  cache?: RequestCache;
  next?: NextFetchRequestConfig;
  headers?: HeadersInit;
};

type RequestBody = Record<string, unknown> | BodyInit | null;

async function parseErrorPayload(response: Response): Promise<ApiError> {
  let detail: unknown = null;
  try {
    const body = await response.json();
    detail = body?.detail ?? body;
  } catch {
    detail = response.statusText;
  }
  return new ApiError(response.status, detail);
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (typeof error.detail === "string") return error.detail;
    if (Array.isArray(error.detail)) {
      return error.detail
        .map(
          (issue: { loc?: unknown[]; msg?: string }) =>
            `${(issue.loc ?? []).join(".")}: ${issue.msg ?? "Invalid value"}`,
        )
        .join(", ");
    }
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}

async function request<T>(
  path: string,
  method: string,
  body?: RequestBody,
  options: ApiRequestOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (body && !(body instanceof FormData) && !(body instanceof Blob)) {
    headers.set("Content-Type", "application/json");
  }

  const token = options.token ?? (options.auth === false ? undefined : authStorage.getToken());
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
    body:
      body && !(body instanceof FormData) && !(body instanceof Blob)
        ? JSON.stringify(body)
        : (body as BodyInit | undefined),
    signal: options.signal,
  }

  // Cache policy:
  // - an explicit caller `cache` option always wins and is copied alone
  //   (`next` is never combined with it);
  // - otherwise an explicit caller `next` config is used on its own;
  // - otherwise GET requests default to `no-store` (safe for authenticated,
  //   customer-specific or order-related reads); non-GET requests get no
  //   cache directive.
  if (options.cache !== undefined) {
    fetchOptions.cache = options.cache
  } else if (options.next !== undefined) {
    fetchOptions.next = options.next
  } else if (method === "GET") {
    fetchOptions.cache = "no-store"
  }

  const response = await fetch(`${env.NEXT_PUBLIC_API_URL}${API_PREFIX}${path}`, fetchOptions);

  if (!response.ok) {
    throw await parseErrorPayload(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  get<T>(path: string, options?: ApiRequestOptions) {
    return request<T>(path, "GET", undefined, options);
  },
  post<T, B = Record<string, unknown>>(path: string, body?: B, options?: ApiRequestOptions) {
    return request<T>(path, "POST", body as RequestBody, options);
  },
  put<T, B = Record<string, unknown>>(path: string, body?: B, options?: ApiRequestOptions) {
    return request<T>(path, "PUT", body as RequestBody, options);
  },
  patch<T, B = Record<string, unknown>>(path: string, body?: B, options?: ApiRequestOptions) {
    return request<T>(path, "PATCH", body as RequestBody, options);
  },
  delete<T>(path: string, options?: ApiRequestOptions) {
    return request<T>(path, "DELETE", undefined, options);
  },
};
