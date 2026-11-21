// Signup and login rules. Each validator returns an error message for the
// chat, or null when the value is fine. The backend enforces the same rules
// (backend/utils/signupRules.js); these only give fast feedback.

import { STUDENT_EMAIL_DOMAIN } from "@/lib/config";

export const USERNAME_PATTERN = /^[a-z0-9._]{3,20}$/i;
export const FIRST_NAME_MAX = 40;
export const MAJOR_MAX = 60;
// Must match "Email OTP Length" in the Supabase dashboard.
export const CODE_LENGTH = 6;
// Same as NEU_EMAIL in backend/utils/signupRules.js (input is lowercased first).
const STUDENT_EMAIL = /^[a-z0-9._%+-]+@northeastern\.edu$/;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

export function validateUsername(value: string) {
  if (!value.trim()) return "you'll need a username.";
  return USERNAME_PATTERN.test(value.trim())
    ? null
    : "usernames are 3–20 letters, numbers, dots or underscores.";
}

export function validateEmail(value: string) {
  const email = normalizeEmail(value);
  if (!email) return "you'll need your student email.";
  return STUDENT_EMAIL.test(email) ? null : `that needs to be a ${STUDENT_EMAIL_DOMAIN} address.`;
}

export function validateFirstName(value: string) {
  if (!value.trim()) return "i'll need your first name.";
  return value.trim().length > FIRST_NAME_MAX ? `keep it under ${FIRST_NAME_MAX} characters.` : null;
}

export function validateMajor(value: string) {
  if (!value.trim()) return "i'll need your major (undeclared is fine!).";
  return value.trim().length > MAJOR_MAX ? `keep it under ${MAJOR_MAX} characters.` : null;
}

export function validateChoice(options: string[], what: string) {
  return (value: string) => (options.includes(value) ? null : `pick your ${what} from the options.`);
}

export function validateCode(value: string) {
  return new RegExp(`^\\d{${CODE_LENGTH}}$`).test(value.trim()) ? null : `the code is ${CODE_LENGTH} digits.`;
}
