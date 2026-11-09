import Link from "next/link";
import { cn } from "@/lib/utils";
import { focusRing } from "@/components/chat-booth/styles";
import { SidequestMark } from "@/components/sidequest-mark";

type SiteHeaderProps = {
  // Where the logo goes: home for visitors, the quests page once logged in.
  homeHref?: string;
  // Links on the right side of the bar.
  children?: React.ReactNode;
};

export function SiteHeader({ homeHref = "/", children }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-ink/10 bg-page/95 backdrop-blur-sm">
      <nav aria-label="Main" className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
        <Link href={homeHref} className={cn("flex items-center gap-2 rounded-md", focusRing)}>
          <SidequestMark className="h-8 w-9" />
          <span className="text-lg font-bold">sidequest</span>
        </Link>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">{children}</div>
      </nav>
    </header>
  );
}

// A plain text link in the header bar.
export function HeaderLink({ className, ...props }: React.ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn("rounded-full px-3 py-2 text-sm font-semibold hover:bg-ink/5", focusRing, className)}
      {...props}
    />
  );
}
