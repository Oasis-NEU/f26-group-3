import type { Metadata } from "next";
import { ProfileView } from "@/components/app/profile-view";

export const metadata: Metadata = { title: "Profile · Sidequest" };

// Waits for the logged-in student (see app/(app)/layout.tsx).
export const instant = false;

export default function Page() {
  return <ProfileView />;
}
