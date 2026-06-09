export type ApiEnvelope<T> = {
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiErrorEnvelope = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: Record<string, unknown>;
};

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isFormData = init.body instanceof FormData;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...init.headers
    }
  });
  const payload = await parseJson<ApiEnvelope<T> | ApiErrorEnvelope>(response);
  if (!response.ok) {
    const errorPayload = payload as ApiErrorEnvelope;
    throw new ApiClientError(
      errorPayload.error?.message ?? 'Request failed',
      response.status,
      errorPayload.error?.code ?? 'REQUEST_FAILED',
      errorPayload.error?.details
    );
  }
  return (payload as ApiEnvelope<T>).data;
}

export async function apiFetchWithCookie<T>(path: string, cookieHeader: string, init: RequestInit = {}): Promise<T> {
  return apiFetch<T>(path, {
    ...init,
    headers: {
      cookie: cookieHeader,
      ...init.headers
    }
  });
}

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}
