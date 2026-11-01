import { createAuthClient } from '../config/supabase.js';
import {
  setAuthCookies, clearAuthCookies, ACCESS_COOKIE, REFRESH_COOKIE,
} from '../utils/authCookies.js';

// Protects routes: only logged-in students get through.
// On success, req.user holds the Supabase user (req.user.id, req.user.email).
export default async function requireAuth(req, res, next) {
  const accessToken = req.cookies[ACCESS_COOKIE];
  const refreshToken = req.cookies[REFRESH_COOKIE];
  const supabase = createAuthClient();

  try {
    // 1. Valid access token? Let them through.
    if (accessToken) {
      const { data, error } = await supabase.auth.getUser(accessToken);
      if (!error && data.user) {
        req.user = data.user;
        return next();
      }
    }

    // 2. Expired or missing, but they have a refresh token? Get new tokens.
    if (refreshToken) {
      const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
      if (!error && data.session) {
        setAuthCookies(res, data.session);
        req.user = data.session.user;
        return next();
      }
    }
  } catch (err) {
    return next(err);
  }

  // 3. Neither worked: they need to log in again
  clearAuthCookies(res);
  return res.status(401).json({ error: 'Please log in.' });
}