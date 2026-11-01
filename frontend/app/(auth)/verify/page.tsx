import type { Metadata } from "next";
import { VerifyForm } from "@/components/auth/verify-form";

export const metadata: Metadata = { title: "Verify your email · Sidequest" };

export default function Page() {
  return <VerifyForm />;
}
