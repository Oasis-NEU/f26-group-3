import { cn } from "@/lib/utils";
import { focusRing } from "@/components/chat-booth/styles";

type ChipProps = Omit<React.ComponentProps<"button">, "type"> & { selected?: boolean };

export function Chip({ selected = false, className, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "rounded-full border-[1.5px] border-ink px-3.5 py-1.5 text-[13.5px] font-medium transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-40",
        selected ? "bg-ink text-white" : "bg-white text-ink hover:bg-ink/5",
        focusRing,
        className,
      )}
      {...props}
    />
  );
}
