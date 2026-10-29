import { cn } from "@/lib/utils";

const FRAME_FILLS = ["bg-frame1", "bg-frame2", "bg-frame3"];

type PhotoStripProps = {
  picks: string[];
  frames?: number;
  className?: string;
};

// Vertical photo-booth strip. Each pick "prints" into the next frame; frames
// are colored by position, so unpicking shifts the rest up and recolors them.
export function PhotoStrip({ picks, frames = 3, className }: PhotoStripProps) {
  return (
    <figure
      className={cn("flex w-fit -rotate-3 flex-col gap-1.5 rounded-[3px] bg-ink p-2 shadow-lg", className)}
    >
      <ol className="flex flex-col gap-1.5" aria-label="Photo strip frames">
        {Array.from({ length: frames }, (_, i) => {
          const pick = picks[i];
          return (
            <li
              key={pick ?? `empty-${i}`}
              className={cn(
                "flex h-[76px] w-[118px] items-center justify-center rounded-[2px] px-2 text-center",
                pick
                  ? cn(FRAME_FILLS[i % FRAME_FILLS.length], "text-[13px] leading-tight font-semibold text-ink motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95")
                  : "border-[1.5px] border-dashed border-white/50 bg-white/12 text-xl text-white/70",
              )}
            >
              {pick ?? (
                <>
                  <span aria-hidden>+</span>
                  <span className="sr-only">empty frame</span>
                </>
              )}
            </li>
          );
        })}
      </ol>
      <figcaption className="pt-0.5 pb-1 text-center text-[10px] tracking-[0.12em] text-white">
        sidequest booth
      </figcaption>
    </figure>
  );
}
