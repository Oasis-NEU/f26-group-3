import type { Metadata } from "next";
import { DoneView } from "@/components/auth/done-view";

export const metadata: Metadata = { title: "You're in · Sidequest" };

export default function Page() {
  return <DoneView />;
}
