// Account rules for the auth routes (email, username, one-time code). Profile
// fields (name, year, interests, ...) are checked in validation/profile.js.
// These mirror frontend/lib/validation.ts; the backend's check is the one that counts.

const USERNAME = /^[a-z0-9._]{3,20}$/;
const NEU_EMAIL = /^[a-z0-9._%+-]+@northeastern\.edu$/;
// 6 digits: must match "Email OTP Length" in the Supabase dashboard and
// CODE_LENGTH in frontend/lib/validation.ts.
const CODE = /^\d{6}$/;

const str = (value) => (typeof value === 'string' ? value.trim() : '');

export const normalizeEmail = (email) => str(email).toLowerCase();
export const normalizeUsername = (username) => str(username).toLowerCase();
export const isStudentEmail = (email) => NEU_EMAIL.test(email);
export const isUsername = (username) => USERNAME.test(username);
export const isCode = (code) => CODE.test(code);
