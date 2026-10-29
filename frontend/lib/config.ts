// App-wide settings. Every switch lives here so there's one place to flip it.

// Demo mode fakes the auth API in the browser so the whole signup and login
// flow works without a backend. On by default in development; force it with
// NEXT_PUBLIC_DEMO_MODE=true or turn it off with NEXT_PUBLIC_DEMO_MODE=false.
const demoFlag = process.env.NEXT_PUBLIC_DEMO_MODE;
export const DEMO_MODE = demoFlag === "true" || (demoFlag !== "false" && process.env.NODE_ENV === "development");

// Simulated network delay for demo responses.
export const DEMO_DELAY_MS = 1000;

// Express backend (see backend/index.js).
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

// Only addresses at this domain can sign up.
export const STUDENT_EMAIL_DOMAIN = "@northeastern.edu";

// Where a successful login lands. Point this at /quests once that page exists.
export const LOGIN_REDIRECT = "/";
