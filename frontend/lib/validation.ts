// Signup and login rules. Each validator returns an error message for the
// chat, or null when the value is fine. The backend must enforce the same
// rules; these only give fast feedback.

import { STUDENT_EMAIL_DOMAIN } from "@/lib/config";

export const USERNAME_PATTERN = /^[a-z0-9._]{3,20}$/i;
export const PASSWORD_MIN_LENGTH = 12;
export const FIRST_NAME_MAX = 40;
export const MAJOR_MAX = 60;
export const CODE_LENGTH = 6;

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
  const [local, domain, extra] = email.split("@");
  const ok = local && domain !== undefined && extra === undefined && `@${domain}` === STUDENT_EMAIL_DOMAIN;
  return ok ? null : `that needs to be a ${STUDENT_EMAIL_DOMAIN} address.`;
}

export function validatePassword(value: string, email: string) {
  if (value.length < PASSWORD_MIN_LENGTH) return `passwords need at least ${PASSWORD_MIN_LENGTH} characters.`;
  const local = normalizeEmail(email).split("@")[0];
  if (local && value.toLowerCase().includes(local)) return "your password can't contain your email name.";
  return null;
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

// Login accepts either a username or a student email.
export function validateIdentifier(value: string) {
  if (!value.trim()) return "i'll need your username or student email.";
  return value.includes("@") ? validateEmail(value) : validateUsername(value);
}

export function validateCode(value: string) {
  return new RegExp(`^\\d{${CODE_LENGTH}}$`).test(value.trim()) ? null : `the code is ${CODE_LENGTH} digits.`;
}
