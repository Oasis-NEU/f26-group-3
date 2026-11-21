import {
  getProfile, updateProfile, createProfile, isUsernameTaken, UsernameTakenError, AlreadyOnboardedError,
} from '../repositories/profiles.repository.js';
import { validateNewProfile, validateProfileUpdate } from '../validation/profile.js';
import { normalizeEmail, normalizeUsername, isUsername } from '../utils/signupRules.js';

const account = (user) => ({ id: user.id, email: user.email });

// GET /api/users/me  ->  { user, profile }   (profile is null until signup is finished)
export async function getMe(req, res) {
  const profile = await getProfile(req.user.id);
  res.json({ user: account(req.user), profile });
}

// POST /api/users/me/profile  body: { email, username, firstName, gender, year, major, campus, interests }
// The last step of signup, after the student verified their email code.
// The saved email comes from the session. The body's email is only checked
// against it, so a leftover session (shared computer, or a student who
// switched emails mid-signup) can't receive someone else's profile.
const alreadyOnboarded = (res) =>
  res.status(409).json({ error: "you've already finished signing up.", code: 'ALREADY_ONBOARDED' });
const usernameTaken = (res) =>
  res.status(409).json({ error: 'someone just took that username.', code: 'USERNAME_TAKEN' });

export async function createMe(req, res) {
  const { email, username: rawUsername, ...fields } = req.body ?? {};
  if (normalizeEmail(email) !== normalizeEmail(req.user.email)) {
    return res.status(403).json({ error: "you're logged in with a different email.", code: 'WRONG_ACCOUNT' });
  }
  const username = normalizeUsername(rawUsername);
  if (!isUsername(username)) {
    return res.status(400).json({ error: 'usernames are 3–20 letters, numbers, dots or underscores.', field: 'username' });
  }
  const { value, error, field } = validateNewProfile(fields);
  if (error) return res.status(400).json({ error, field });

  if (await getProfile(req.user.id)) return alreadyOnboarded(res);
  if (await isUsernameTaken(username, req.user.id)) return usernameTaken(res);

  try {
    const profile = await createProfile(req.user.id, { username, email: req.user.email, ...value });
    res.status(201).json({ user: account(req.user), profile });
  } catch (err) {
    if (err instanceof UsernameTakenError) return usernameTaken(res);
    if (err instanceof AlreadyOnboardedError) return alreadyOnboarded(res);
    throw err;
  }
}

// PATCH /api/users/me   body: any of { firstName, gender, year, major, campus, interests }
export async function updateMe(req, res) {
  const { value, error, field } = validateProfileUpdate(req.body);
  if (error) return res.status(400).json({ error, field });

  const profile = await updateProfile(req.user.id, value);
  if (!profile) return res.status(404).json({ error: 'Finish signing up before editing your profile.' });

  res.json({ user: account(req.user), profile });
}
