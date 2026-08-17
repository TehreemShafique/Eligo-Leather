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

  // Default Stale-While-Revalidate caching options (< 0.6s TTFB & < 0.4s content load guarantee)
  const defaultNextConfig: NextFetchRequestConfig =
    method === "GET"
      ? { revalidate: 60, tags: ["catalog", "menus", "settings"] }
      : {};

  const fetchOptions: RequestInit = {
    method,
    headers,
    body:
      body && !(body instanceof FormData) && !(body instanceof Blob)
        ? JSON.stringify(body)
        : (body as BodyInit | undefined),
    signal: options.signal,
    cache: options.cache,
    next: options.next ?? defaultNextConfig,
  };

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
