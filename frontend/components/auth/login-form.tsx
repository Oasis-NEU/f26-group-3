"use client";

import { useRouter } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import { BoothLink } from "@/components/chat-booth/chat-header";
import { ChatForm, type ChatStep, type ChatValues } from "@/components/chat-booth/chat-form";
import { AuthError, authApi, setPendingEmail } from "@/lib/auth";
import { LOGIN_REDIRECT } from "@/lib/config";
import { normalizeEmail, validateIdentifier } from "@/lib/validation";

const steps: ChatStep[] = [
  {
    key: "identifier",
    question: "welcome back! what's your username or student email?",
    kind: "text",
    placeholder: "username or email",
    autoComplete: "username",
    validate: validateIdentifier,
  },
  {
    key: "password",
    question: "and your password?",
    kind: "password",
    autoComplete: "current-password",
    validate: (v) => (v ? null : "i'll need your password."),
  },
];

const EMPTY = { identifier: "", password: "" };

export function LoginForm() {
  const router = useRouter();
  const [values, setValues] = useState<ChatValues>(EMPTY);
  const [session, setSession] = useState(0);

  // Next keeps left pages mounted but hidden: forget the password and start
  // the chat over whenever the user navigates away.
  useLayoutEffect(() => {
    return () => {
      setValues(EMPTY);
      setSession((s) => s + 1);
    };
  }, []);

  async function logIn({ identifier, password }: ChatValues) {
    try {
      await authApi.login(identifier, password);
    } catch (err) {
      if (err instanceof AuthError && err.code === "UNVERIFIED") {
        const email = err.email ?? (identifier.includes("@") ? normalizeEmail(identifier) : null);
        if (email) {
          setPendingEmail(email);
          router.push("/verify");
          return;
        }
      }
      return err instanceof AuthError ? err.message : "something went wrong. please try again.";
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4">
      <ChatForm
        key={session}
        title="sidequest login"
        subtitle="welcome back"
        label="Log in chat"
        steps={steps}
        values={values}
        onAnswer={(key, value) => setValues((v) => ({ ...v, [key]: value }))}
        onReset={() => setValues(EMPTY)}
        onComplete={logIn}
        closing={["you're in! 🎉", "your quests page is still being built, so i'll take you home for now."]}
        next={{ href: LOGIN_REDIRECT }}
        footer={
          <>
            new here? <BoothLink href="/signup">sign up</BoothLink>
          </>
        }
      />
    </div>
  );
}
