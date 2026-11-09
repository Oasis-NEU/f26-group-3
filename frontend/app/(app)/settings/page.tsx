import type { Metadata } from "next";
import { SettingsView } from "@/components/app/settings-view";

export const metadata: Metadata = { title: "Settings · Sidequest" };

// Waits for the logged-in student (see app/(app)/layout.tsx).
export const instant = false;

export default function Page() {
  return <SettingsView />;
}
