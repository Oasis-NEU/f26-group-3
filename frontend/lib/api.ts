// Shared fetch helper for the Express backend. Sends the session cookies and
// turns error responses ({ error, code?, field?, email? }) into ApiError.

import { API_URL } from "@/lib/config";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public email?: string,
    public field?: string,
  ) {
    super(message);
  }
}

export async function request<T>(method: "GET" | "POST" | "PATCH", path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api${path}`, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      credentials: "include",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("can't reach sidequest right now. try again in a moment.", 0);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      data.error ?? "something went wrong. please try again.",
      res.status,
      data.code,
      data.email,
      data.field,
    );
  }
  return data as T;
}
