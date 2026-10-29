import { cn } from "@/lib/utils";

const variants = {
  // App messages sit on the left with the tail bottom-left.
  app: "self-start rounded-[16px_16px_16px_4px] bg-white",
  // User answers sit on the right with the tail bottom-right.
  me: "self-end rounded-[16px_16px_4px_16px] bg-me",
};

type BubbleProps = {
  from: keyof typeof variants;
  children: React.ReactNode;
  // Hints are quieter app messages (password rules and the like).
  tone?: "hint";
  className?: string;
};

export function Bubble({ from, children, tone, className }: BubbleProps) {
  return (
    <div
      className={cn(
        "max-w-[80%] px-3 py-2 text-[13.5px] leading-snug break-words text-ink",
        "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1",
        variants[from],
        tone === "hint" && "text-soft",
        className,
      )}
    >
      <span className="sr-only">{from === "app" ? "sidequest says: " : "you said: "}</span>
      {children}
    </div>
  );
}

export function TypingBubble() {
  return (
    <Bubble from="app" className="flex items-center gap-1 py-3">
      <span className="sr-only">typing</span>
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          aria-hidden
          className="size-1.5 rounded-full bg-soft motion-safe:animate-bounce"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </Bubble>
  );
}
