import { getProfile, updateProfile } from '../repositories/profiles.repository.js';
import { validateProfileUpdate } from '../validation/profile.js';

const account = (user) => ({ id: user.id, email: user.email });

// GET /api/users/me  ->  { user, profile }   (profile is null until signup is finished)
export async function getMe(req, res) {
  const profile = await getProfile(req.user.id);
  res.json({ user: account(req.user), profile });
}

// PATCH /api/users/me   body: any of { firstName, gender, year, major, campus, interests }
export async function updateMe(req, res) {
  const { value, error, field } = validateProfileUpdate(req.body);
  if (error) return res.status(400).json({ error, field });

  const profile = await updateProfile(req.user.id, value);
  if (!profile) return res.status(404).json({ error: 'Finish signing up before editing your profile.' });

  res.json({ user: account(req.user), profile });
}
