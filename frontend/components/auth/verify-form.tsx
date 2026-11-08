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

// /verify: the code step of login. Signup has its own (/signup/verify).
export function VerifyForm() {
  // undefined on the server (no sessionStorage), null = nothing pending
  const email = useSyncExternalStore(subscribeHandoff, getPendingEmail, () => undefined);
  // New hand-off data (another login) starts the chat over.
  const version = useSyncExternalStore(subscribeHandoff, getHandoffVersion, () => 0);

  if (email === undefined) return null;

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4">
      {email === null ? (
        <>
          <ChatHeader title="sidequest login" subtitle="check your email" />
          <div role="log" className="flex flex-1 flex-col justify-end gap-2 py-8">
            <Bubble from="app">hmm, there&apos;s nothing to verify yet.</Bubble>
            <Bubble from="app">
              <BoothLink href="/login">log in</BoothLink> or <BoothLink href="/signup">sign up</BoothLink> and
              we&apos;ll email you a code.
            </Bubble>
          </div>
        </>
      ) : (
        <VerifyChat
          key={version}
          email={email}
          title="sidequest login"
          subtitle="check your email"
          // An account whose signup never finished goes back to /signup.
          next={(onboarded) => (onboarded ? { href: LOGIN_REDIRECT } : { href: "/signup", label: "Finish signing up" })}
        />
      )}
    </div>
  );
}

type VerifyChatProps = {
  email: string;
  title: string;
  subtitle: string;
  // Where to go once verified, given whether the student has a profile yet.
  next: (onboardingComplete: boolean) => { href: string; label?: string };
};

// Asks for the emailed code and trades it for the session cookies.
export function VerifyChat({ email, title, subtitle, next }: VerifyChatProps) {
  const [values, setValues] = useState<ChatValues>({ code: "" });
  const [onboarded, setOnboarded] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  async function verify({ code }: ChatValues) {
    try {
      const { onboardingComplete } = await authApi.verify(email, code);
      setOnboarded(onboardingComplete);
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
      title={title}
      subtitle={subtitle}
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
      next={next(onboarded)}
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
