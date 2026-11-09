// The logged-in student's profile (GET/PATCH /api/users/me). In demo mode
// (lib/config.ts) the student is always "logged in" and the profile lives in
// sessionStorage, seeded from the strip they printed at signup if there is one.

import { request } from "@/lib/api";
import { getStripJson, parseStrip } from "@/lib/auth";
import { DEMO_DELAY_MS, DEMO_MODE } from "@/lib/config";

export type Profile = {
  username: string;
  email: string;
  firstName: string;
  gender: string;
  year: string;
  major: string;
  campus: string;
  interests: string[];
};

export type EditableProfile = Pick<Profile, "firstName" | "gender" | "year" | "major" | "campus" | "interests">;

// profile is null when the account exists but signup wasn't finished.
export type Me = { user: { id: string; email: string }; profile: Profile | null };

// --- demo mode -------------------------------------------------------------

const DEMO_PROFILE_KEY = "sidequest:demo-profile";

function demoProfile(): Profile {
  try {
    const saved = sessionStorage.getItem(DEMO_PROFILE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  const strip = parseStrip(getStripJson());
  return {
    username: "sam",
    email: "sam@northeastern.edu",
    firstName: strip?.firstName ?? "sam",
    gender: "prefer not to say",
    year: "2nd",
    major: "undeclared",
    campus: "Boston",
    interests: strip?.interests ?? ["concert buddies", "cafe hopping", "gym buddies"],
  };
}

async function demoMe(changes?: Partial<EditableProfile>): Promise<Me> {
  await new Promise((resolve) => setTimeout(resolve, DEMO_DELAY_MS / 2));
  const profile = { ...demoProfile(), ...changes };
  if (changes) {
    try {
      sessionStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(profile));
    } catch {}
  }
  return { user: { id: "demo", email: profile.email }, profile };
}

// ---------------------------------------------------------------------------

export const profileApi = {
  me: () => (DEMO_MODE ? demoMe() : request<Me>("GET", "/users/me")),
  update: (changes: Partial<EditableProfile>) =>
    DEMO_MODE ? demoMe(changes) : request<Me>("PATCH", "/users/me", changes),
};
