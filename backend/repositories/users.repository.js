// Reads and writes the `users` and `user_information` tables.
// Uses the admin client (secret key), so Row Level Security does not apply:
// only call these with ids and emails the server has already checked.

import { supabase } from '../config/supabase.js';

export class UsernameTakenError extends Error {}

const UNIQUE_VIOLATION = '23505';

// The signup chat shows friendly labels; the table's check constraints
// only accept these keys. academic_year already matches ("1st".."grad").
const DB_GENDER = {
  woman: 'woman',
  man: 'man',
  'non-binary': 'non_binary',
  'prefer not to say': 'prefer_not_to_say',
};
const DB_INTEREST = {
  'concert buddies': 'concert',
  'study groups': 'study',
  'cafe hopping': 'cafe',
  'night out': 'night_out',
  'gym buddies': 'gym',
  'dialogue buddies': 'dialogue',
};

export async function findUserById(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('user_id, username, northeastern_email')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(`findUserById: ${error.message}`);
  return data;
}

export async function isUsernameTaken(username) {
  const { count, error } = await supabase
    .from('users')
    .select('user_id', { count: 'exact', head: true })
    .eq('username', username);
  if (error) throw new Error(`isUsernameTaken: ${error.message}`);
  return count > 0;
}

export async function isEmailRegistered(email) {
  const { count, error } = await supabase
    .from('users')
    .select('user_id', { count: 'exact', head: true })
    .eq('northeastern_email', email);
  if (error) throw new Error(`isEmailRegistered: ${error.message}`);
  return count > 0;
}

// Saves a new student's signup answers. `userId` and `email` come from the
// verified Supabase session, never from the request body.
export async function createProfile(userId, email, profile) {
  const { error: userError } = await supabase.from('users').insert({
    user_id: userId,
    username: profile.username,
    northeastern_email: email,
  });
  if (userError) {
    if (userError.code === UNIQUE_VIOLATION) throw new UsernameTakenError();
    throw new Error(`createProfile users: ${userError.message}`);
  }

  const { error: infoError } = await supabase.from('user_information').insert({
    user_id: userId,
    first_name: profile.firstName,
    major: profile.major,
    academic_year: profile.year,
    gender: DB_GENDER[profile.gender],
    campus: profile.campus.toLowerCase(),
    interests: profile.interests.map((interest) => DB_INTEREST[interest]),
  });
  if (infoError) {
    // Undo the first insert so the student can try signing up again.
    await supabase.from('users').delete().eq('user_id', userId);
    throw new Error(`createProfile user_information: ${infoError.message}`);
  }
}
