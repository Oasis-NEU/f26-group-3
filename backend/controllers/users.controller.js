import {
  getProfile, updateProfile, createProfile, isUsernameTaken, UsernameTakenError,
} from '../repositories/profiles.repository.js';
import { validateNewProfile, validateProfileUpdate } from '../validation/profile.js';
import { normalizeUsername, isUsername } from '../utils/signupRules.js';

const account = (user) => ({ id: user.id, email: user.email });

// GET /api/users/me  ->  { user, profile }   (profile is null until signup is finished)
export async function getMe(req, res) {
  const profile = await getProfile(req.user.id);
  res.json({ user: account(req.user), profile });
}

// POST /api/users/me/profile  body: { username, firstName, gender, year, major, campus, interests }
// The last step of signup, after the student verified their email code.
// The email comes from the session, never the body.
export async function createMe(req, res) {
  const { username: rawUsername, ...fields } = req.body ?? {};
  const username = normalizeUsername(rawUsername);
  if (!isUsername(username)) {
    return res.status(400).json({ error: 'usernames are 3–20 letters, numbers, dots or underscores.', field: 'username' });
  }
  const { value, error, field } = validateNewProfile(fields);
  if (error) return res.status(400).json({ error, field });

  if (await getProfile(req.user.id)) {
    return res.status(409).json({ error: "you've already finished signing up.", code: 'ALREADY_ONBOARDED' });
  }
  if (await isUsernameTaken(username)) {
    return res.status(409).json({ error: 'someone just took that username.', code: 'USERNAME_TAKEN' });
  }

  try {
    const profile = await createProfile(req.user.id, { username, email: req.user.email, ...value });
    res.status(201).json({ user: account(req.user), profile });
  } catch (err) {
    if (err instanceof UsernameTakenError) {
      return res.status(409).json({ error: 'someone just took that username.', code: 'USERNAME_TAKEN' });
    }
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
