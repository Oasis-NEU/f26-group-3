import { createAuthClient } from '../config/supabase.js';
import {
  setAuthCookies, clearAuthCookies, ACCESS_COOKIE, REFRESH_COOKIE,
} from '../utils/authCookies.js';

const NEU_EMAIL = /^[a-z0-9._%+-]+@northeastern\.edu$/;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

// POST /api/auth/send-link   body: { email }
export async function sendLink(req, res, next) {
  const email = normalizeEmail(req.body?.email);
  if (!NEU_EMAIL.test(email)) {
    return res.status(400).json({ error: 'Use your @northeastern.edu email.' });
  }

  try {
    const { error } = await createAuthClient().auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,                             // first-timers get an account
        emailRedirectTo: `${FRONTEND_ORIGIN}/auth/confirm`, // where the link points
      },
    });

    if (error?.status === 429) {
      return res.status(429).json({ error: 'Please wait a minute before requesting another link.' });
    }
    // Logged for you, hidden from the student (e.g. "Email address not authorized")
    if (error) console.error('signInWithOtp failed:', error.message);

    // Same response either way, so this can't be used to probe for accounts
    res.json({ message: 'If that email is valid, a sign-in link is on its way.' });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/confirm   body: { token_hash }
export async function confirmLink(req, res, next) {
  const tokenHash = String(req.body?.token_hash || '').trim();
  if (!tokenHash || tokenHash.length > 200) {
    return res.status(400).json({ error: 'Invalid sign-in link.' });
  }

  try {
    const { data, error } = await createAuthClient().auth.verifyOtp({
      token_hash: tokenHash,
      type: 'email',
    });

    if (error || !data.session) {
      return res.status(401).json({ error: 'This link is invalid or expired. Request a new one.' });
    }

    setAuthCookies(res, data.session);
    res.json({ user: { id: data.user.id, email: data.user.email } });
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