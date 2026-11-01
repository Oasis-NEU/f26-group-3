import { DEMO_MODE } from "@/lib/config";

// Shown on every page while the auth API is faked (see lib/config.ts).
export function DemoBanner() {
  if (!DEMO_MODE) return null;
  return (
    <p className="bg-frame1 px-4 py-1 text-center text-xs font-semibold text-ink">
      demo mode · no real accounts or emails
    </p>
  );
}
