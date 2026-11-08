import { findUserById, createProfile, UsernameTakenError } from '../repositories/users.repository.js';
import { parseProfile } from '../utils/signupRules.js';

// GET /api/users/me  ->  the logged-in student
export async function getMe(req, res, next) {
  try {
    const row = await findUserById(req.user.id);
    res.json({
      user: { id: req.user.id, email: req.user.email, username: row?.username ?? null },
      onboardingComplete: Boolean(row),
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/users/me/profile  { username, firstName, gender, year, major, campus, interests }
// The last step of signup. The email comes from the session, not the body.
export async function createMyProfile(req, res, next) {
  const { profile, error } = parseProfile(req.body);
  if (error) return res.status(400).json({ error, code: 'INVALID_PROFILE' });

  try {
    if (await findUserById(req.user.id)) {
      return res.status(409).json({ error: "you've already finished signing up.", code: 'ALREADY_ONBOARDED' });
    }
    await createProfile(req.user.id, req.user.email, profile);
    res.status(201).json({ onboardingComplete: true });
  } catch (err) {
    if (err instanceof UsernameTakenError) {
      return res.status(409).json({ error: 'someone just took that username.', code: 'USERNAME_TAKEN' });
    }
    next(err);
  }
}
