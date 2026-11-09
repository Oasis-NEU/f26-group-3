import { cn } from "@/lib/utils";

// Shared focus ring for every Chat Booth control: ink ring offset from the page.
export const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-page";

// Pill buttons and button-styled links.
export const primaryButton = cn(
  "inline-flex items-center justify-center rounded-full bg-me px-5 py-3 text-sm font-semibold text-ink transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
  focusRing,
);
export const secondaryButton = cn(
  "inline-flex items-center justify-center rounded-full border-[1.5px] border-ink/25 px-5 py-3 text-sm font-semibold text-ink hover:border-ink disabled:cursor-not-allowed disabled:opacity-50",
  focusRing,
);
