import { cn } from "@/lib/utils";

type SidequestMarkProps = {
  className?: string;
  // Leave unset when the mark sits next to visible "sidequest" text.
  title?: string;
};

// The Sidequest logo: two overlapping chat bubbles with a spark. Inline so it
// needs no request and picks up the palette names from globals.css.
export function SidequestMark({ className, title }: SidequestMarkProps) {
  return (
    <svg
      viewBox="136 84 98 86"
      className={cn("shrink-0", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <rect x="140" y="88" width="62" height="46" rx="18" className="fill-frame3" />
      <path d="M150 130 L143 148 L166 134 Z" className="fill-frame3" />
      <rect x="168" y="106" width="62" height="46" rx="18" className="fill-me" />
      <path d="M220 148 L228 166 L204 152 Z" className="fill-me" />
      <path
        d="M168 124 A18 18 0 0 1 186 106 L202 106 L202 116 A18 18 0 0 1 184 134 L168 134 Z"
        className="fill-frame1"
      />
      <path
        d="M185 112 Q186.3 118.7 193 120 Q186.3 121.3 185 128 Q183.7 121.3 177 120 Q183.7 118.7 185 112 Z"
        className="fill-ink"
      />
    </svg>
  );
}
