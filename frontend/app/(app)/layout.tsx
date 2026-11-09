import { AppNav } from "@/components/app/app-nav";
import { ProfileGate } from "@/components/app/profile-gate";
import { SiteHeader } from "@/components/site-header";

// Every page in this group requires a logged-in student. ProfileGate holds
// each page back until the student loads, so the pages set `instant = false`.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col bg-page font-sans text-ink">
      <SiteHeader homeHref="/quests">
        <AppNav />
      </SiteHeader>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-10">
        <ProfileGate>{children}</ProfileGate>
      </main>
    </div>
  );
}
