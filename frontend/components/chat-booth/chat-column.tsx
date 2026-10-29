"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { focusRing } from "@/components/chat-booth/styles";

type ChatColumnProps = {
  label: string;
  // Changing this scrolls the newest message into view.
  scrollKey: unknown;
  // Static content shown above the live log (e.g. intro bubbles and chips).
  lead?: React.ReactNode;
  messages: React.ReactNode;
  quickReplies?: React.ReactNode;
  bar: React.ReactNode;
  footer?: React.ReactNode;
  // "bottom" stacks messages against the bar like a chat app; "top" keeps
  // them under the header so nothing floats mid-screen.
  anchor?: "top" | "bottom";
  className?: string;
};

// The conversation (announced to screen readers as it grows) with the
// quick replies and message bar pinned to the bottom of the viewport.
export function ChatColumn({
  label,
  scrollKey,
  lead,
  messages,
  quickReplies,
  bar,
  footer,
  anchor = "bottom",
  className,
}: ChatColumnProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    endRef.current?.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
  }, [scrollKey]);

  return (
    <section aria-label={label} className={cn("flex flex-1 flex-col", className)}>
      <div className={cn("flex flex-1 flex-col gap-2 py-4", anchor === "bottom" && "justify-end")}>
        {lead}
        <div role="log" aria-live="polite" aria-relevant="additions" className="flex flex-col gap-2">
          {messages}
        </div>
        <div ref={endRef} />
      </div>
      <div className="sticky bottom-0 flex flex-col gap-3 bg-page pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {quickReplies}
        {bar}
        {footer && <div className="text-center text-xs text-soft">{footer}</div>}
      </div>
    </section>
  );
}

// White pill holding the input (or status text) and the main "me" button.
export function MessageBar({
  children,
  onSubmit,
}: {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex min-h-12 items-center gap-2 rounded-full bg-white py-1.5 pr-1.5 pl-4 shadow-[0_1px_0_rgb(59_47_92/0.08)] focus-within:ring-2 focus-within:ring-ink focus-within:ring-offset-2 focus-within:ring-offset-page"
    >
      {children}
    </form>
  );
}

const mainButton = cn(
  "shrink-0 rounded-full bg-me px-4 py-2 text-sm font-semibold text-ink transition-opacity hover:opacity-90",
  "disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-progress aria-disabled:opacity-70",
  focusRing,
);

export function SendButton({ className, ...props }: Omit<React.ComponentProps<"button">, "type">) {
  return <button type="submit" className={cn(mainButton, "focus-visible:ring-offset-white", className)} {...props} />;
}

export const KeepGoingLink = ({ href, children = "Keep going", ref }: {
  href: string;
  children?: React.ReactNode;
  ref?: React.Ref<HTMLAnchorElement>;
}) => (
  <Link ref={ref} href={href} className={cn(mainButton, "block w-full py-3 text-center")}>
    {children} →
  </Link>
);
