import type { Metadata } from "next";
import { SignupVerify } from "@/components/auth/signup-verify";

export const metadata: Metadata = { title: "Verify your email · Sidequest" };

export default function Page() {
  return <SignupVerify />;
}
