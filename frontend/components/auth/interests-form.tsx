"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bubble, TypingBubble } from "@/components/chat-booth/bubble";
import { ChatColumn, MessageBar, SendButton } from "@/components/chat-booth/chat-column";
import { BoothLink, ChatHeader } from "@/components/chat-booth/chat-header";
import { Chip } from "@/components/chat-booth/chip";
import { PhotoStrip } from "@/components/chat-booth/photo-strip";
import { useSignup } from "@/components/auth/signup-context";
import { AuthError, authApi, setPendingEmail, setStrip, type SignupPayload } from "@/lib/auth";
import { CAMPUSES, GENDERS, INTERESTS, MAX_INTERESTS, YEARS } from "@/lib/signup-options";
import {
  validateChoice,
  validateEmail,
  validateFirstName,
  validateMajor,
  validatePassword,
  validateUsername,
} from "@/lib/validation";

type Note = { id: number; content: React.ReactNode };

// Every earlier answer, which step it lives on, and how to check it.
const EARLIER_ANSWERS: {
  key: keyof SignupPayload;
  label: string;
  step: { href: string; name: string };
  check: (v: string, d: SignupPayload) => string | null;
}[] = [
  { key: "username", label: "username", step: { href: "/signup", name: "step 1" }, check: validateUsername },
  { key: "email", label: "email", step: { href: "/signup", name: "step 1" }, check: validateEmail },
  { key: "password", label: "password", step: { href: "/signup", name: "step 1" }, check: (v, d) => validatePassword(v, d.email) },
  { key: "firstName", label: "first name", step: { href: "/signup/details", name: "step 2" }, check: validateFirstName },
  { key: "gender", label: "gender", step: { href: "/signup/details", name: "step 2" }, check: validateChoice(GENDERS, "gender") },
  { key: "year", label: "year", step: { href: "/signup/details", name: "step 2" }, check: validateChoice(YEARS, "year") },
  { key: "major", label: "major", step: { href: "/signup/details", name: "step 2" }, check: validateMajor },
  { key: "campus", label: "campus", step: { href: "/signup/details", name: "step 2" }, check: validateChoice(CAMPUSES, "campus") },
];

let lastId = 0;

export function InterestsForm() {
  const router = useRouter();
  const { data, update } = useSignup();
  const [notes, setNotes] = useState<Note[]>([]);
  const [pending, setPending] = useState(false);

  const picks = data.interests;
  const ready = picks.length === MAX_INTERESTS;

  function note(content: React.ReactNode) {
    setNotes((n) => [...n, { id: ++lastId, content }]);
  }

  function toggle(interest: string) {
    if (pending) return;
    if (picks.includes(interest)) {
      update({ interests: picks.filter((p) => p !== interest) });
    } else if (picks.length >= MAX_INTERESTS) {
      note("your strip is full. unpick one to swap.");
    } else {
      update({ interests: [...picks, interest] });
    }
  }

  async function print(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending || !ready) return;

    for (const { key, label, step, check } of EARLIER_ANSWERS) {
      const value = data[key] as string;
      if (!value || check(value, data)) {
        note(
          <>
            hmm, your {label} is {value ? "not valid" : "missing"}. <BoothLink href={step.href}>go back to {step.name}</BoothLink>{" "}
            to fix it.
          </>,
        );
        return;
      }
    }

    setPending(true);
    try {
      await authApi.signup(data);
      setPendingEmail(data.email);
      setStrip({ firstName: data.firstName.trim(), interests: picks });
      // Leaving /signup/* makes SignupProvider wipe the answers, password included.
      router.push("/verify");
    } catch (err) {
      if (err instanceof AuthError && err.code === "USERNAME_TAKEN") {
        note(
          <>
            hmm, {err.message} <BoothLink href="/signup">pick another in step 1</BoothLink>.
          </>,
        );
      } else {
        note(`hmm, ${err instanceof AuthError ? err.message : "something went wrong. please try again."}`);
      }
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4">
      <ChatHeader
        title="sidequest signup"
        subtitle="step 3 of 3 · your strip"
        onStartOver={
          pending
            ? undefined
            : () => {
                update({ interests: [] });
                setNotes([]);
              }
        }
      />
      {/* Strip first in the DOM so it sits above the chat on mobile; row-reverse puts it on the right on desktop. */}
      <div className="flex flex-1 flex-col md:flex-row-reverse md:items-stretch md:justify-between md:gap-16">
        <div className="flex justify-center pt-6 pb-2 md:w-64 md:items-start md:pt-12">
          <div className="md:sticky md:top-24">
            <PhotoStrip picks={picks} frames={MAX_INTERESTS} />
          </div>
        </div>

        <ChatColumn
          label="Interests chat"
          className="md:max-w-md"
          anchor="top"
          scrollKey={`${notes.length}-${pending}`}
          lead={
            <>
              <Bubble from="app">{data.firstName ? `last step, ${data.firstName}!` : "last step!"}</Bubble>
              <Bubble from="app">
                pick {MAX_INTERESTS} sidequests you&apos;re into. each one prints into your strip 📸
              </Bubble>
              <div role="group" aria-label="Interests" className="flex flex-wrap gap-2 py-1">
                {INTERESTS.map((interest) => (
                  <Chip key={interest} selected={picks.includes(interest)} onClick={() => toggle(interest)}>
                    {interest}
                  </Chip>
                ))}
              </div>
            </>
          }
          messages={
            <>
              {notes.map((n) => (
                <Bubble key={n.id} from="app">
                  {n.content}
                </Bubble>
              ))}
              {pending && <TypingBubble />}
            </>
          }
          bar={
            <MessageBar onSubmit={print}>
              <p aria-live="polite" className="min-w-0 flex-1 text-sm text-soft">
                {ready ? "your strip is ready" : `${picks.length} of ${MAX_INTERESTS} picked`}
              </p>
              <SendButton disabled={!ready} aria-disabled={pending || undefined}>
                {pending ? "Printing…" : "Print my strip"}
              </SendButton>
            </MessageBar>
          }
        />
      </div>
    </div>
  );
}
