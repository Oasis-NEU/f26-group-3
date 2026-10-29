import Link from "next/link";
import { cn } from "@/lib/utils";
import { focusRing } from "@/components/chat-booth/styles";

type ChatHeaderProps = {
  title: string;
  // Keep it short (e.g. "step 1 of 3 · your account") so it fits at 390px.
  subtitle: string;
  onStartOver?: () => void;
};

// Group-chat style header: stacked avatars, chat name, subtitle, start over.
export function ChatHeader({ title, subtitle, onStartOver }: ChatHeaderProps) {
  return (
    <header className="sticky top-0 z-10 -mx-4 flex items-center gap-3 border-b border-ink/10 bg-page/95 px-4 py-3 backdrop-blur-sm">
      <div aria-hidden className="flex shrink-0 -space-x-2">
        <span className="size-6 rounded-full border-2 border-page bg-me" />
        <span className="size-6 rounded-full border-2 border-page bg-frame2" />
        <span className="size-6 rounded-full border-2 border-page bg-frame3" />
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[15px] leading-tight font-bold">{title}</h1>
        <p className="truncate text-xs text-soft">{subtitle}</p>
      </div>
      {onStartOver && (
        <button
          type="button"
          onClick={onStartOver}
          className={cn(
            "shrink-0 rounded-full border-[1.5px] border-ink/25 px-3 py-1 text-xs font-semibold hover:border-ink",
            focusRing,
          )}
        >
          start over
        </button>
      )}
    </header>
  );
}

export function BoothLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn("rounded-sm font-semibold text-ink underline underline-offset-4 hover:no-underline", focusRing)}
    >
      {children}
    </Link>
  );
}
