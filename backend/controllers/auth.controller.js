import { createAuthClient } from '../config/supabase.js';
import {
  setAuthCookies, clearAuthCookies, ACCESS_COOKIE, REFRESH_COOKIE,
} from '../utils/authCookies.js';
import { normalizeEmail, normalizeUsername, isStudentEmail, isUsername, isCode } from '../utils/signupRules.js';
import { getProfile, isUsernameTaken } from '../repositories/profiles.repository.js';

// Sign-in is passwordless: Supabase emails a 6-digit code (the {{ .Token }}
// in the email templates) and /verify trades it for a session.
//
//   POST /api/auth/signup  { username, email }  -> 201
//   POST /api/auth/login   { email }            -> 200  (same answer whether or not the account exists)
//   POST /api/auth/resend  { email }            -> 200  (same)
//   POST /api/auth/verify  { email, code }      -> 200 { user, onboardingComplete }  (sets cookies)
//   POST /api/auth/logout                       -> 200
//
// Signup finishes with POST /api/users/me/profile once the student is logged in.
//
// Errors are { error, code? } with a 4xx status.

const badEmail = (res) =>
  res.status(400).json({ error: 'that needs to be a @northeastern.edu address.', code: 'INVALID_EMAIL' });

// Supabase's answer when shouldCreateUser is false and the email has no account.
const isNoAccount = (error) => error.code === 'otp_disabled' || /signups not allowed/i.test(error.message);

// Asks Supabase to email a code. Returns the response to send if it failed.
// With shouldCreateUser false, an unknown email counts as success, so login
// and resend can't be used to probe which students have accounts.
async function emailCode(res, email, shouldCreateUser) {
  const { error } = await createAuthClient().auth.signInWithOtp({ email, options: { shouldCreateUser } });
  if (!error || (!shouldCreateUser && isNoAccount(error))) return null;

  if (error.status === 429) {
    return res.status(429).json({ error: 'please wait a minute before asking for another code.', code: 'RATE_LIMITED' });
  }
  console.error('signInWithOtp failed:', error.status, error.code, error.message);
  return res.status(502).json({ error: "we couldn't send the code. try again in a moment." });
}

// POST /api/auth/signup
export async function signup(req, res, next) {
  const email = normalizeEmail(req.body?.email);
  const username = normalizeUsername(req.body?.username);
  if (!isStudentEmail(email)) return badEmail(res);
  if (!isUsername(username)) {
    return res.status(400).json({ error: 'usernames are 3–20 letters, numbers, dots or underscores.', code: 'INVALID_USERNAME' });
  }

  try {
    // No "email taken" error: an existing student just gets a login code, and
    // /verify reports onboardingComplete so the frontend sends them home.
    if (await isUsernameTaken(username)) {
      return res.status(409).json({ error: 'that username is already taken.', code: 'USERNAME_TAKEN' });
    }
    // Username is only checked here; it's saved with the rest of the profile.
    if (await emailCode(res, email, true)) return;
    res.status(201).json({});
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
export async function login(req, res, next) {
  const email = normalizeEmail(req.body?.email);
  if (!isStudentEmail(email)) return badEmail(res);

  try {
    if (await emailCode(res, email, false)) return;
    res.json({});
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/resend
export async function resend(req, res, next) {
  const email = normalizeEmail(req.body?.email);
  if (!isStudentEmail(email)) return badEmail(res);

  try {
    // shouldCreateUser: false, so this can't create accounts. signup already did.
    if (await emailCode(res, email, false)) return;
    res.json({});
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/verify
export async function verify(req, res, next) {
  const email = normalizeEmail(req.body?.email);
  const code = String(req.body?.code ?? '').trim();
  if (!isStudentEmail(email)) return badEmail(res);
  if (!isCode(code)) return res.status(400).json({ error: "that code doesn't look right. it's the number in your email.", code: 'INVALID_CODE' });

  try {
    const { data, error } = await createAuthClient().auth.verifyOtp({ email, token: code, type: 'email' });
    if (error || !data.session) {
      return res.status(400).json({
        error: "that code didn't work or has expired. check your email or ask for a new one.",
        code: 'INVALID_CODE',
      });
    }

    setAuthCookies(res, data.session);
    const { user } = data;
    const onboardingComplete = Boolean(await getProfile(user.id));
    res.json({ user: { id: user.id, email: user.email }, onboardingComplete });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/logout
export async function logout(req, res) {
  const access_token = req.cookies[ACCESS_COOKIE];
  const refresh_token = req.cookies[REFRESH_COOKIE];

  // Revoke the session on Supabase's side too, not just delete the cookies
  try {
    if (access_token && refresh_token) {
      const supabase = createAuthClient();
      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (!error) await supabase.auth.signOut({ scope: 'local' });
    }
  } catch (err) {
    console.error('Supabase sign-out failed:', err.message);
  }

  clearAuthCookies(res);
  res.json({ ok: true });
}
