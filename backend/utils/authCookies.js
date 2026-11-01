// Sets and clears the two HTTP-only cookies that hold the Supabase session.

export const ACCESS_COOKIE = 'sb_access';
export const REFRESH_COOKIE = 'sb_refresh';

const baseOptions = {
  httpOnly: true,                                // browser JS can't read it
  secure: process.env.NODE_ENV === 'production', // HTTPS only when deployed
  sameSite: 'lax',                               // change to 'none' if frontend and backend end up on different domains
  path: '/',
};

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

export function setAuthCookies(res, session) {
  // Access token: short-lived (about an hour), matches Supabase's expiry
  res.cookie(ACCESS_COOKIE, session.access_token, {
    ...baseOptions,
    maxAge: session.expires_in * 1000,
  });
  // Refresh token: keeps the student logged in for 2 weeks without a new link
  res.cookie(REFRESH_COOKIE, session.refresh_token, {
    ...baseOptions,
    maxAge: FOURTEEN_DAYS_MS,
  });
}

export function clearAuthCookies(res) {
  res.clearCookie(ACCESS_COOKIE, baseOptions);
  res.clearCookie(REFRESH_COOKIE, baseOptions);
}