"use client";

import { useRouter } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import { BoothLink } from "@/components/chat-booth/chat-header";
import { ChatForm, type ChatStep, type ChatValues } from "@/components/chat-booth/chat-form";
import { AuthError, authApi, clearStrip, setPendingEmail } from "@/lib/auth";
import { STUDENT_EMAIL_DOMAIN } from "@/lib/config";
import { validateEmail } from "@/lib/validation";

const steps: ChatStep[] = [
  {
    key: "email",
    question: "welcome back! what's your student email?",
    hint: "we'll email you a code to log in.",
    kind: "email",
    placeholder: `you${STUDENT_EMAIL_DOMAIN}`,
    autoComplete: "email",
    inputMode: "email",
    validate: validateEmail,
  },
];

const EMPTY = { email: "" };

export function LoginForm() {
  const router = useRouter();
  const [values, setValues] = useState<ChatValues>(EMPTY);
  const [session, setSession] = useState(0);
  // Logged-in pages send visitors here with ?next=/where-they-were;
  // /verify passes it on once the code checks out.
  const [verifyHref, setVerifyHref] = useState("/verify");

  // Next keeps left pages mounted but hidden: start the chat over whenever
  // the user navigates away.
  useLayoutEffect(() => {
    return () => {
      setValues(EMPTY);
      setSession((s) => s + 1);
    };
  }, []);

  async function sendCode({ email }: ChatValues) {
    try {
      await authApi.login(email);
    } catch (err) {
      return err instanceof AuthError ? err.message : "something went wrong. please try again.";
    }
    const next = new URLSearchParams(window.location.search).get("next");
    const href = next ? `/verify?next=${encodeURIComponent(next)}` : "/verify";
    setVerifyHref(href);
    clearStrip(); // a leftover strip from an earlier signup isn't this student's
    setPendingEmail(email);
    router.push(href);
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
        onComplete={sendCode}
        // The backend answers the same for unknown emails, so don't promise a code.
        closing={["if that email has an account, a code is on its way 📬"]}
        next={{ href: verifyHref }}
        footer={
          <>
            new here? <BoothLink href="/signup">sign up</BoothLink>
          </>
        }
      />
    </div>
  );
}
