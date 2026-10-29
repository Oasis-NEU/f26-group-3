"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Bubble } from "@/components/chat-booth/bubble";
import { BoothLink, ChatHeader } from "@/components/chat-booth/chat-header";
import { ChatForm, type ChatStep, type ChatValues } from "@/components/chat-booth/chat-form";
import { Chip } from "@/components/chat-booth/chip";
import {
  AuthError,
  RESEND_COOLDOWN_SECONDS,
  authApi,
  getHandoffVersion,
  getPendingEmail,
  getStripJson,
  subscribeHandoff,
} from "@/lib/auth";
import { DEMO_MODE, LOGIN_REDIRECT } from "@/lib/config";
import { CODE_LENGTH, validateCode } from "@/lib/validation";

const steps: ChatStep[] = [
  {
    key: "code",
    question: `what's the ${CODE_LENGTH}-digit code?`,
    kind: "text",
    placeholder: "123456",
    autoComplete: "one-time-code",
    inputMode: "numeric",
    maxLength: CODE_LENGTH,
    validate: validateCode,
  },
];

export function VerifyForm() {
  // undefined on the server (no sessionStorage), null = nothing pending
  const email = useSyncExternalStore(subscribeHandoff, getPendingEmail, () => undefined);
  const fromSignup = useSyncExternalStore(subscribeHandoff, () => getStripJson() !== null, () => false);
  // New hand-off data (someone else signing up) starts the chat over.
  const version = useSyncExternalStore(subscribeHandoff, getHandoffVersion, () => 0);

  if (email === undefined) return null;

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4">
      {email === null ? (
        <>
          <ChatHeader title="sidequest signup" subtitle="check your email" />
          <div role="log" className="flex flex-1 flex-col justify-end gap-2 py-8">
            <Bubble from="app">hmm, there&apos;s nothing to verify yet.</Bubble>
            <Bubble from="app">
              <BoothLink href="/signup">sign up</BoothLink> or <BoothLink href="/login">log in</BoothLink> and
              we&apos;ll email you a code.
            </Bubble>
          </div>
        </>
      ) : (
        <VerifyChat key={version} email={email} next={fromSignup ? "/signup/done" : LOGIN_REDIRECT} />
      )}
    </div>
  );
}

function VerifyChat({ email, next }: { email: string; next: string }) {
  const [values, setValues] = useState<ChatValues>({ code: "" });
  const [notice, setNotice] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  async function verify({ code }: ChatValues) {
    try {
      await authApi.verify(email, code);
    } catch (err) {
      return err instanceof AuthError ? err.message : "something went wrong. please try again.";
    }
  }

  async function resend() {
    setNotice(null);
    try {
      await authApi.resend(email);
      setNotice("new code sent!");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setNotice(err instanceof AuthError ? err.message : "couldn't send a new code.");
    }
  }

  return (
    <ChatForm
      title="sidequest signup"
      subtitle="check your email"
      label="Verify email chat"
      intro={[
        "check your inbox 📬",
        `we sent a ${CODE_LENGTH}-digit code to ${email}. it expires in 10 minutes.`,
        ...(DEMO_MODE ? ["(demo mode: no email is sent. any 6 digits work except 000000.)"] : []),
      ]}
      steps={steps}
      values={values}
      onAnswer={(key, value) => setValues((v) => ({ ...v, [key]: value }))}
      onReset={() => setValues({ code: "" })}
      onComplete={verify}
      closing={["you're verified ✅"]}
      next={next === "/signup/done" ? { href: next, label: "See my strip" } : { href: next }}
      footer={
        <div className="flex items-center justify-center gap-3">
          <span aria-live="polite">{notice}</span>
          <Chip onClick={resend} disabled={cooldown > 0} className="py-1 text-xs">
            {cooldown > 0 ? `resend code in ${cooldown}s` : "resend code"}
          </Chip>
        </div>
      }
    />
  );
}
