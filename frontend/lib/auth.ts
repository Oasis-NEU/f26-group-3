// The one module that talks to the auth API. In demo mode (lib/config.ts)
// the same functions return fake responses so the flow works without a backend.

import { API_URL, DEMO_DELAY_MS, DEMO_MODE } from "@/lib/config";
import { CODE_LENGTH, normalizeEmail, normalizeUsername } from "@/lib/validation";

export const RESEND_COOLDOWN_SECONDS = 60;

export type SignupPayload = {
  username: string;
  email: string;
  password: string;
  firstName: string;
  gender: string;
  year: string;
  major: string;
  campus: string;
  interests: string[];
};

export type LoginResult = { onboardingComplete: boolean };

export class AuthError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public email?: string,
  ) {
    super(message);
  }
}

// Expected backend contract (POST, JSON, cookies for the session):
//   /api/auth/signup  SignupPayload             -> 201 {}            (emails a code)
//   /api/auth/verify  { email, code }           -> 200 {}            (sets session cookie)
//   /api/auth/resend  { email }                 -> 200 {}
//   /api/auth/login   { identifier, password }  -> 200 LoginResult   (sets session cookie)
// `identifier` is a username or a student email.
// Errors: { error: string, code?: string } with a 4xx/5xx status, e.g.
//   409 { code: "USERNAME_TAKEN" } from signup,
//   403 { code: "UNVERIFIED", email } from login.

async function post<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/auth${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
  } catch {
    throw new AuthError("can't reach sidequest right now. try again in a moment.", 0);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(data.error ?? "something went wrong. please try again.", res.status, data.code, data.email);
  }
  return data as T;
}

// --- demo mode -------------------------------------------------------------
// Error triggers: username "taken" (signup), password "wrongpass" (login),
// code "000000" (verify).

const wait = () => new Promise((resolve) => setTimeout(resolve, DEMO_DELAY_MS));

async function demo<T>(path: string, body: Record<string, unknown>): Promise<T> {
  await wait();
  if (path === "/signup" && body.username === "taken") {
    throw new AuthError("that username is already taken.", 409, "USERNAME_TAKEN");
  }
  if (path === "/login" && body.password === "wrongpass") {
    throw new AuthError("that password doesn't match. try again?", 401, "INVALID_CREDENTIALS");
  }
  if (path === "/verify" && body.code === "0".repeat(CODE_LENGTH)) {
    throw new AuthError("that code didn't work. check your email and try again.", 400, "INVALID_CODE");
  }
  return (path === "/login" ? { onboardingComplete: true } : {}) as T;
}

const call = <T>(path: string, body: Record<string, unknown>) =>
  DEMO_MODE ? demo<T>(path, body) : post<T>(path, body);

// ---------------------------------------------------------------------------

export function normalizeIdentifier(identifier: string) {
  return identifier.includes("@") ? normalizeEmail(identifier) : normalizeUsername(identifier);
}

export const authApi = {
  signup: (payload: SignupPayload) =>
    call<object>("/signup", {
      ...payload,
      username: normalizeUsername(payload.username),
      email: normalizeEmail(payload.email),
      firstName: payload.firstName.trim(),
      major: payload.major.trim(),
    }),
  verify: (email: string, code: string) => call<object>("/verify", { email: normalizeEmail(email), code: code.trim() }),
  resend: (email: string) => call<object>("/resend", { email: normalizeEmail(email) }),
  login: (identifier: string, password: string) =>
    call<LoginResult>("/login", { identifier: normalizeIdentifier(identifier), password }),
};

// --- hand-off between pages --------------------------------------------------
// sessionStorage carries the email being verified and the finished strip to
// /verify and /signup/done. It never holds the password. Next keeps visited
// pages mounted (hidden), so readers subscribe and re-render on every write.

const PENDING_EMAIL_KEY = "sidequest:pending-email";
const STRIP_KEY = "sidequest:strip";

export type FinishedStrip = { firstName: string; interests: string[] };

let handoffVersion = 0;
const listeners = new Set<() => void>();

export function subscribeHandoff(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Bumps on every write; key on it to start a page over for new hand-off data.
export const getHandoffVersion = () => handoffVersion;

function read(key: string) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
  } catch {}
  handoffVersion++;
  listeners.forEach((listener) => listener());
}

export const getPendingEmail = () => read(PENDING_EMAIL_KEY);
export const setPendingEmail = (email: string) => write(PENDING_EMAIL_KEY, normalizeEmail(email));

// Returns the raw JSON string so useSyncExternalStore gets a stable snapshot.
export const getStripJson = () => read(STRIP_KEY);
export const setStrip = (strip: FinishedStrip) => write(STRIP_KEY, JSON.stringify(strip));
export const clearStrip = () => write(STRIP_KEY, null);

export function parseStrip(json: string | null): FinishedStrip | null {
  if (!json) return null;
  try {
    const value = JSON.parse(json);
    return typeof value?.firstName === "string" && Array.isArray(value?.interests) ? value : null;
  } catch {
    return null;
  }
}
