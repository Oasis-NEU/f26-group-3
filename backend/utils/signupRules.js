// Server-side copy of the signup rules in frontend/lib/validation.ts and
// frontend/lib/signup-options.ts. The frontend checks only give fast
// feedback; these are the ones that count. Keep the two in sync, and update
// the label -> database key maps in repositories/users.repository.js too.

export const GENDERS = ['woman', 'man', 'non-binary', 'prefer not to say'];
export const YEARS = ['1st', '2nd', '3rd', '4th', '5th', 'grad'];
export const CAMPUSES = ['Boston', 'Oakland', 'London', 'NYC'];
export const INTERESTS = [
  'concert buddies',
  'study groups',
  'cafe hopping',
  'night out',
  'gym buddies',
  'dialogue buddies',
];
export const MAX_INTERESTS = 3;

const USERNAME = /^[a-z0-9._]{3,20}$/;
const NEU_EMAIL = /^[a-z0-9._%+-]+@northeastern\.edu$/;
// Supabase codes are 6-10 digits ("Email OTP Length" in the dashboard).
const CODE = /^\d{6,10}$/;
const FIRST_NAME_MAX = 40;
const MAJOR_MAX = 60;

const str = (value) => (typeof value === 'string' ? value.trim() : '');

export const normalizeEmail = (email) => str(email).toLowerCase();
export const isStudentEmail = (email) => NEU_EMAIL.test(email);
export const isCode = (code) => CODE.test(code);
export const normalizeUsername = (username) => str(username).toLowerCase();
export const isUsername = (username) => USERNAME.test(username);

// Returns { profile } with cleaned values, or { error } with a message for the student.
export function parseProfile(body) {
  const profile = {
    username: normalizeUsername(body?.username),
    firstName: str(body?.firstName),
    gender: str(body?.gender),
    year: str(body?.year),
    major: str(body?.major),
    campus: str(body?.campus),
    interests: Array.isArray(body?.interests) ? body.interests : [],
  };

  if (!USERNAME.test(profile.username)) return { error: 'usernames are 3–20 letters, numbers, dots or underscores.' };
  if (!profile.firstName || profile.firstName.length > FIRST_NAME_MAX) return { error: 'that first name doesn\'t look right.' };
  if (!GENDERS.includes(profile.gender)) return { error: 'pick your gender from the options.' };
  if (!YEARS.includes(profile.year)) return { error: 'pick your year from the options.' };
  if (!profile.major || profile.major.length > MAJOR_MAX) return { error: 'that major doesn\'t look right.' };
  if (!CAMPUSES.includes(profile.campus)) return { error: 'pick your campus from the options.' };
  if (
    profile.interests.length !== MAX_INTERESTS ||
    new Set(profile.interests).size !== MAX_INTERESTS ||
    !profile.interests.every((i) => INTERESTS.includes(i))
  ) {
    return { error: `pick ${MAX_INTERESTS} different interests from the options.` };
  }

  return { profile };
}
