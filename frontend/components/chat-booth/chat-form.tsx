"use client";

import { useEffect, useRef, useState } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Bubble, TypingBubble } from "@/components/chat-booth/bubble";
import { ChatColumn, KeepGoingLink, MessageBar, SendButton } from "@/components/chat-booth/chat-column";
import { ChatHeader } from "@/components/chat-booth/chat-header";
import { Chip } from "@/components/chat-booth/chip";
import { focusRing } from "@/components/chat-booth/styles";

export type ChatStep = {
  key: string;
  question: string;
  // Quieter app bubble under the question the first time it's asked.
  hint?: string;
  kind: "text" | "email" | "password" | "chips";
  options?: string[];
  placeholder?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
  // Error message for the chat, or null if the answer is fine.
  validate?: (value: string) => string | null;
};

export type ChatValues = Record<string, string>;

type Message = { id: number; from: "app" | "me"; content: React.ReactNode; tone?: "hint" };
type Phase = "asking" | "pending" | "done";

type ChatFormProps = {
  title: string;
  subtitle: string;
  label: string;
  intro?: string[];
  steps: ChatStep[];
  values: ChatValues;
  onAnswer: (key: string, value: string) => void;
  // Clears this page's answers (the "start over" button).
  onReset: () => void;
  // Runs after the last answer. Return an error message to re-ask the last
  // question; return nothing on success (or after navigating away).
  onComplete?: (values: ChatValues) => Promise<string | null | void> | string | null | void;
  closing: string[];
  next: { href: string; label?: string };
  footer?: React.ReactNode;
};

let lastId = 0;
const msg = (from: Message["from"], content: React.ReactNode, tone?: Message["tone"]): Message => ({
  id: ++lastId,
  from,
  content,
  tone,
});

const display = (step: ChatStep, value: string) =>
  step.kind === "password" ? "•".repeat(Math.min(Math.max(value.length, 6), 12)) : value;

const ask = (step: ChatStep, withHint = true) => [
  msg("app", step.question),
  ...(withHint && step.hint ? [msg("app", step.hint, "hint")] : []),
];

// Replays answers that are already valid (e.g. after pressing back) and
// stops at the first question that still needs one.
function replay(steps: ChatStep[], values: ChatValues, intro: string[], closing: string[]) {
  const messages = intro.map((text) => msg("app", text));
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const value = values[step.key] ?? "";
    if (!value || step.validate?.(value)) {
      return { messages: [...messages, ...ask(step)], index: i, phase: "asking" as Phase };
    }
    messages.push(msg("app", step.question), msg("me", display(step, value)));
  }
  return {
    messages: [...messages, ...closing.map((text) => msg("app", text))],
    index: steps.length - 1,
    phase: "done" as Phase,
  };
}

export function ChatForm({
  title,
  subtitle,
  label,
  intro = [],
  steps,
  values,
  onAnswer,
  onReset,
  onComplete,
  closing,
  next,
  footer,
}: ChatFormProps) {
  const [chat, setChat] = useState(() => replay(steps, values, intro, closing));
  const [draft, setDraft] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusTick, setFocusTick] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const keepGoingRef = useRef<HTMLAnchorElement>(null);

  const { messages, index, phase } = chat;
  const step = steps[index];
  const showChips = phase === "asking" && step.kind === "chips";

  // After every turn, focus goes where the next answer happens. Never the body.
  useEffect(() => {
    if (phase === "done") keepGoingRef.current?.focus();
    else if (step.kind === "chips") chipsRef.current?.querySelector("button")?.focus();
    else inputRef.current?.focus();
  }, [focusTick, phase, step]);

  function say(...added: Message[]) {
    setChat((c) => ({ ...c, messages: [...c.messages, ...added] }));
  }

  async function answer(raw: string) {
    if (phase !== "asking") return;
    const value = step.kind === "password" ? raw : raw.trim();
    const problem = step.validate ? step.validate(value) : value ? null : "i didn't catch that.";

    if (problem) {
      // Show the attempt, explain, ask again.
      say(...(value ? [msg("me", display(step, value))] : []), msg("app", `hmm, ${problem}`), ...ask(step, false));
      // The attempt is in the transcript now, so the bar starts empty.
      setDraft("");
      setFocusTick((t) => t + 1);
      return;
    }

    onAnswer(step.key, value);
    setDraft("");
    setShowPassword(false);

    if (index < steps.length - 1) {
      const nextStep = steps[index + 1];
      setChat((c) => ({ ...c, index: index + 1, messages: [...c.messages, msg("me", display(step, value)), ...ask(nextStep)] }));
      return;
    }

    setChat((c) => ({ ...c, phase: "pending", messages: [...c.messages, msg("me", display(step, value))] }));
    const error = await onComplete?.({ ...values, [step.key]: value });
    if (error) {
      setChat((c) => ({ ...c, phase: "asking", messages: [...c.messages, msg("app", `hmm, ${error}`), ...ask(step, false)] }));
      setDraft("");
      setFocusTick((t) => t + 1);
      return;
    }
    setChat((c) => ({ ...c, phase: "done", messages: [...c.messages, ...closing.map((text) => msg("app", text))] }));
  }

  function startOver() {
    onReset();
    setDraft("");
    setShowPassword(false);
    setChat(replay(steps, {}, intro, closing));
    setFocusTick((t) => t + 1);
  }

  const quickReplies = showChips && (
    <div ref={chipsRef} role="group" aria-label={step.question} className="flex flex-wrap justify-end gap-2">
      {step.options?.map((option) => (
        <Chip key={option} selected={values[step.key] === option} onClick={() => answer(option)}>
          {option}
        </Chip>
      ))}
    </div>
  );

  const inputId = `chat-input-${step.key}`;
  const bar =
    phase === "done" ? (
      <KeepGoingLink ref={keepGoingRef} href={next.href}>
        {next.label}
      </KeepGoingLink>
    ) : (
      <MessageBar
        onSubmit={(e) => {
          e.preventDefault();
          answer(draft);
        }}
      >
        <label htmlFor={inputId} className="sr-only">
          {showChips ? "Tap an option above" : step.question}
        </label>
        <input
          ref={inputRef}
          id={inputId}
          name={step.key}
          type={
            step.kind === "password" ? (showPassword ? "text" : "password") : step.kind === "email" ? "email" : "text"
          }
          autoComplete={step.autoComplete}
          inputMode={step.inputMode}
          maxLength={step.maxLength}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder={showChips ? "tap an option above" : step.placeholder}
          value={showChips ? "" : draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={showChips}
          readOnly={phase === "pending"}
          className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-soft disabled:cursor-not-allowed"
        />
        {step.kind === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-pressed={showPassword}
            aria-label="Show password"
            className={cn("rounded-full p-1.5 text-soft hover:text-ink", focusRing, "focus-visible:ring-offset-white")}
          >
            {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
          </button>
        )}
        {/* aria-disabled (not disabled) while sending, so focus stays put. */}
        <SendButton disabled={showChips} aria-disabled={phase === "pending" || undefined}>
          Send
        </SendButton>
      </MessageBar>
    );

  return (
    <>
      <ChatHeader title={title} subtitle={subtitle} onStartOver={phase === "pending" ? undefined : startOver} />
      <ChatColumn
        label={label}
        scrollKey={`${messages.length}-${phase}`}
        messages={
          <>
            {messages.map((m) => (
              <Bubble key={m.id} from={m.from} tone={m.tone}>
                {m.content}
              </Bubble>
            ))}
            {phase === "pending" && <TypingBubble />}
          </>
        }
        quickReplies={quickReplies}
        bar={bar}
        footer={footer}
      />
    </>
  );
}
