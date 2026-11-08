// The one module that talks to the auth API. In demo mode (lib/config.ts)
// the same functions return fake responses so the flow works without a backend.

import { API_URL, DEMO_DELAY_MS, DEMO_MODE } from "@/lib/config";
import { CODE_LENGTH, normalizeEmail, normalizeUsername } from "@/lib/validation";

export const RESEND_COOLDOWN_SECONDS = 60;

// Everything the signup chat collects. `email` is only used to send the code;
// the backend takes the email from the session when saving the profile.
export type SignupPayload = {
  username: string;
  email: string;
  firstName: string;
  gender: string;
  year: string;
  major: string;
  campus: string;
  interests: string[];
};

export type SessionUser = { id: string; email: string };
export type VerifyResult = { user: SessionUser; onboardingComplete: boolean };
export type Me = { user: SessionUser & { username: string | null }; onboardingComplete: boolean };

export class AuthError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
  }
}

// Backend contract (JSON; the session lives in HTTP-only cookies the browser
// sends automatically, so this code never sees a token). Sign-in is
// passwordless: routes that email something send a one-time code.
//   POST /api/auth/signup       { username, email }  -> 201 {}             (emails a code)
//   POST /api/auth/login        { email }            -> 200 {}             (emails a code)
//   POST /api/auth/resend       { email }            -> 200 {}
//   POST /api/auth/verify       { email, code }      -> 200 VerifyResult   (sets session cookies)
//   POST /api/auth/logout       {}                   -> 200                (clears them)
//   GET  /api/users/me                               -> 200 Me, or 401 when logged out
//   POST /api/users/me/profile  profile answers      -> 201                (needs the session)
// Errors: { error: string, code?: string } with a 4xx/5xx status, e.g.
//   409 { code: "USERNAME_TAKEN" | "EMAIL_TAKEN" } from signup,
//   404 { code: "NO_ACCOUNT" } from login.

async function request<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api${path}`, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      credentials: "include", // send and receive the session cookies
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new AuthError("can't reach sidequest right now. try again in a moment.", 0);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(data.error ?? "something went wrong. please try again.", res.status, data.code);
  }
  return data as T;
}

// --- demo mode -------------------------------------------------------------
// Error triggers: username "taken" (signup), email "nobody@northeastern.edu"
// (login), code "000000" (verify). Demo mode is always "logged in".

const wait = () => new Promise((resolve) => setTimeout(resolve, DEMO_DELAY_MS));

async function demo<T>(path: string, body: Record<string, unknown> = {}): Promise<T> {
  await wait();
  if (path === "/auth/signup" && body.username === "taken") {
    throw new AuthError("that username is already taken.", 409, "USERNAME_TAKEN");
  }
  if (path === "/auth/login" && body.email === "nobody@northeastern.edu") {
    throw new AuthError("there's no account with that email yet.", 404, "NO_ACCOUNT");
  }
  if (path === "/auth/verify" && body.code === "0".repeat(CODE_LENGTH)) {
    throw new AuthError("that code didn't work. check your email and try again.", 400, "INVALID_CODE");
  }
  const user = { id: "demo", email: "demo@northeastern.edu" };
  if (path === "/auth/verify") return { user, onboardingComplete: true } as T;
  if (path === "/users/me") return { user: { ...user, username: "demo" }, onboardingComplete: true } as T;
  return {} as T;
}

const post = <T>(path: string, body: Record<string, unknown>) =>
  DEMO_MODE ? demo<T>(path, body) : request<T>("POST", path, body);
const get = <T>(path: string) => (DEMO_MODE ? demo<T>(path) : request<T>("GET", path));

// ---------------------------------------------------------------------------

export const authApi = {
  signup: (username: string, email: string) =>
    post<object>("/auth/signup", { username: normalizeUsername(username), email: normalizeEmail(email) }),
  login: (email: string) => post<object>("/auth/login", { email: normalizeEmail(email) }),
  verify: (email: string, code: string) =>
    post<VerifyResult>("/auth/verify", { email: normalizeEmail(email), code: code.trim() }),
  resend: (email: string) => post<object>("/auth/resend", { email: normalizeEmail(email) }),
  logout: () => post<object>("/auth/logout", {}),

  // The logged-in student, or null when logged out. Use this to guard pages.
  me: async (): Promise<Me | null> => {
    try {
      return await get<Me>("/users/me");
    } catch (err) {
      if (err instanceof AuthError && err.status === 401) return null;
      throw err;
    }
  },

  // Last step of signup; needs the session from verify.
  // The email isn't sent: the backend takes it from the session.
  saveProfile: (data: SignupPayload) =>
    post<object>("/users/me/profile", {
      username: normalizeUsername(data.username),
      firstName: data.firstName.trim(),
      gender: data.gender,
      year: data.year,
      major: data.major.trim(),
      campus: data.campus,
      interests: data.interests,
    }),
};

// --- hand-off between pages --------------------------------------------------
// sessionStorage carries the email being verified (login -> /verify) and the
// finished strip (-> /signup/done). Next keeps visited pages mounted (hidden),
// so readers subscribe and re-render on every write.

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
