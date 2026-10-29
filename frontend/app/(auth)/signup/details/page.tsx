import type { Metadata } from "next";
import { DetailsForm } from "@/components/auth/details-form";

export const metadata: Metadata = { title: "About you · Sidequest" };

export default function Page() {
  return <DetailsForm />;
}
