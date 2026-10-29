import type { Metadata } from "next";
import { InterestsForm } from "@/components/auth/interests-form";

export const metadata: Metadata = { title: "Your interests · Sidequest" };

export default function Page() {
  return <InterestsForm />;
}
