import { supabase } from '../config/supabase.js';
import { toInfoRow, toProfile } from './profileRows.js';

// A student's profile is split across two tables:
//   users            (user_id, username, northeastern_email)
//   user_information (user_id, first_name, academic_year, gender, major, campus, interests)
// Callers only see the Profile shape from profileRows.js.

const INFO_COLUMNS = 'first_name, academic_year, gender, major, campus, interests';

// Thrown by createProfile when the username was taken after signup checked it.
export class UsernameTakenError extends Error {}

const UNIQUE_VIOLATION = '23505';

function check(error, action) {
  if (error) throw new Error(`Failed to ${action}: ${error.message}`);
}

async function exists(column, value) {
  const { count, error } = await supabase
    .from('users')
    .select('user_id', { count: 'exact', head: true })
    .eq(column, value);
  check(error, `look up ${column}`);
  return count > 0;
}

export const isUsernameTaken = (username) => exists('username', username);
export const isEmailRegistered = (email) => exists('northeastern_email', email);

// Returns the student's Profile, or null if they haven't finished signing up.
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('users')
    .select(`username, northeastern_email, user_information (${INFO_COLUMNS})`)
    .eq('user_id', userId)
    .maybeSingle();
  check(error, 'load profile');

  if (!data?.user_information) return null;
  return toProfile(data, data.user_information);
}

// Creates both rows for a new student. Meant for the signup handler, after
// validateNewProfile(). If the second insert fails, the first is undone so a
// retry starts clean.
export async function createProfile(userId, { username, email, ...fields }) {
  const { error: userError } = await supabase
    .from('users')
    .insert({ user_id: userId, username, northeastern_email: email });
  // Only a unique index on users.username makes this reliable; signup also checks first.
  if (userError?.code === UNIQUE_VIOLATION && /username/.test(userError.message)) throw new UsernameTakenError();
  check(userError, 'create user');

  const { error: infoError } = await supabase
    .from('user_information')
    .insert({ user_id: userId, ...toInfoRow(fields) });
  if (infoError) {
    await supabase.from('users').delete().eq('user_id', userId);
    check(infoError, 'create profile');
  }

  return getProfile(userId);
}

// Applies a validated partial update. Returns the updated Profile, or null
// if the student has no profile to update.
export async function updateProfile(userId, fields) {
  const { data, error } = await supabase
    .from('user_information')
    .update({ ...toInfoRow(fields), updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select('user_id');
  check(error, 'update profile');

  if (data.length === 0) return null;
  return getProfile(userId);
}
