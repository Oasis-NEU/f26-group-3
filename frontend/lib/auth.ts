// The one module that talks to the auth API. In demo mode (lib/config.ts)
// the same functions return fake responses so the flow works without a backend.
// The logged-in student's profile lives in lib/profile.ts.

import { ApiError, request } from "@/lib/api";
import { DEMO_DELAY_MS, DEMO_MODE } from "@/lib/config";
import { CODE_LENGTH, normalizeEmail, normalizeUsername } from "@/lib/validation";

// Auth failures are ordinary API errors; the alias keeps existing imports working.
export { ApiError as AuthError } from "@/lib/api";

export const RESEND_COOLDOWN_SECONDS = 60;

// Everything the signup chat collects. When saving the profile, `email` is
// only checked against the session's; the backend saves the session's.
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

export type VerifyResult = { user: { id: string; email: string }; onboardingComplete: boolean };

// Backend contract (JSON; the session lives in HTTP-only cookies the browser
// sends automatically, so this code never sees a token). Sign-in is
// passwordless: routes that email something send a one-time code.
//   POST /api/auth/signup       { username, email }  -> 201 {}             (emails a code)
//   POST /api/auth/login        { email }            -> 200 {}             (emails a code if the account exists)
//   POST /api/auth/resend       { email }            -> 200 {}
//   POST /api/auth/verify       { email, code }      -> 200 VerifyResult   (sets session cookies)
//   POST /api/auth/logout       {}                   -> 200                (clears them)
//   POST /api/users/me/profile  profile answers      -> 201                (needs the session)
// Errors: { error: string, code?: string } with a 4xx/5xx status, e.g.
//   409 { code: "USERNAME_TAKEN" } from signup,
//   403 { code: "WRONG_ACCOUNT" } from saving a profile while logged in as another email.
// Signup and login never say whether an email has an account.

// --- demo mode -------------------------------------------------------------
// Error triggers: username "taken" (signup), code "000000" (verify).
// Demo mode is always "logged in".

const wait = () => new Promise((resolve) => setTimeout(resolve, DEMO_DELAY_MS));

async function demo<T>(path: string, body: Record<string, unknown>): Promise<T> {
  await wait();
  if (path === "/auth/signup" && body.username === "taken") {
    throw new ApiError("that username is already taken.", 409, "USERNAME_TAKEN");
  }
  if (path === "/auth/verify" && body.code === "0".repeat(CODE_LENGTH)) {
    throw new ApiError("that code didn't work. check your email and try again.", 400, "INVALID_CODE");
  }
  if (path === "/auth/verify") return { user: { id: "demo", email: body.email }, onboardingComplete: true } as T;
  return {} as T;
}

const post = <T>(path: string, body: Record<string, unknown>) =>
  DEMO_MODE ? demo<T>(path, body) : request<T>("POST", path, body);

// ---------------------------------------------------------------------------

export const authApi = {
  signup: (username: string, email: string) =>
    post<object>("/auth/signup", { username: normalizeUsername(username), email: normalizeEmail(email) }),
  login: (email: string) => post<object>("/auth/login", { email: normalizeEmail(email) }),
  verify: (email: string, code: string) =>
    post<VerifyResult>("/auth/verify", { email: normalizeEmail(email), code: code.trim() }),
  resend: (email: string) => post<object>("/auth/resend", { email: normalizeEmail(email) }),
  logout: () => post<object>("/auth/logout", {}),

  // Last step of signup; needs the session from verify. The backend rejects
  // it if the session belongs to a different email.
  saveProfile: (data: SignupPayload) =>
    post<object>("/users/me/profile", {
      email: normalizeEmail(data.email),
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
