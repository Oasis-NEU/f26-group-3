// Rules for the profile fields a student can edit. These mirror
// frontend/lib/validation.ts and frontend/lib/signup-options.ts; the frontend
// only gives fast feedback, this is the check that counts.

// The API uses the labels students see; the database stores short codes
// (enforced by check constraints on user_information). Each map is
// label -> stored value, and profiles.repository.js converts between them.
export const STORED_VALUE = {
  gender: {
    'woman': 'woman',
    'man': 'man',
    'non-binary': 'non_binary',
    'prefer not to say': 'prefer_not_to_say',
  },
  year: { '1st': '1st', '2nd': '2nd', '3rd': '3rd', '4th': '4th', '5th': '5th', 'grad': 'grad' },
  campus: { Boston: 'boston', Oakland: 'oakland', London: 'london', NYC: 'nyc' },
  interests: {
    'concert buddies': 'concert',
    'study groups': 'study',
    'cafe hopping': 'cafe',
    'night out': 'night_out',
    'gym buddies': 'gym',
    'dialogue buddies': 'dialogue',
  },
};

export const GENDERS = Object.keys(STORED_VALUE.gender);
export const YEARS = Object.keys(STORED_VALUE.year);
export const CAMPUSES = Object.keys(STORED_VALUE.campus);
export const INTERESTS = Object.keys(STORED_VALUE.interests);
export const INTEREST_COUNT = 3;
export const FIRST_NAME_MAX = 40;
export const MAJOR_MAX = 60;

const text = (max, what) => (value) => {
  if (typeof value !== 'string' || !value.trim()) return { error: `${what} is required.` };
  const trimmed = value.trim();
  return trimmed.length > max ? { error: `${what} must be at most ${max} characters.` } : { value: trimmed };
};

const choice = (options, what) => (value) =>
  options.includes(value) ? { value } : { error: `Pick a valid ${what}.` };

function interests(value) {
  if (!Array.isArray(value)) return { error: `Pick exactly ${INTEREST_COUNT} interests.` };
  const unique = [...new Set(value)];
  if (unique.length !== INTEREST_COUNT || unique.length !== value.length) {
    return { error: `Pick exactly ${INTEREST_COUNT} different interests.` };
  }
  return unique.every((i) => INTERESTS.includes(i)) ? { value: unique } : { error: 'Pick interests from the list.' };
}

const FIELDS = {
  firstName: text(FIRST_NAME_MAX, 'First name'),
  gender: choice(GENDERS, 'gender'),
  year: choice(YEARS, 'year'),
  major: text(MAJOR_MAX, 'Major'),
  campus: choice(CAMPUSES, 'campus'),
  interests,
};

// Validates a partial update. Returns { value } with only the cleaned fields
// that were sent, or { error, field } for the first problem found.
export function validateProfileUpdate(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Send the fields to update as a JSON object.' };
  }

  const keys = Object.keys(body);
  const unknown = keys.find((key) => !(key in FIELDS));
  if (unknown) return { error: `${unknown} can't be changed here.`, field: unknown };
  if (keys.length === 0) return { error: 'Nothing to update.' };

  const value = {};
  for (const key of keys) {
    const result = FIELDS[key](body[key]);
    if (result.error) return { error: result.error, field: key };
    value[key] = result.value;
  }
  return { value };
}

// Validates a full profile, e.g. at signup: every field is required.
export function validateNewProfile(body) {
  const missing = Object.keys(FIELDS).find((key) => body?.[key] === undefined);
  if (missing) return { error: `${missing} is required.`, field: missing };
  return validateProfileUpdate(Object.fromEntries(Object.keys(FIELDS).map((key) => [key, body[key]])));
}
