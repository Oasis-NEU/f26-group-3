import type { Metadata } from "next";
import { QuestsView } from "@/components/app/quests-view";

export const metadata: Metadata = { title: "Quests · Sidequest" };

// Waits for the logged-in student (see app/(app)/layout.tsx).
export const instant = false;

export default function Page() {
  return <QuestsView />;
}
