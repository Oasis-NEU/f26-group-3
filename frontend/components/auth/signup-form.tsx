"use client";

import { useRouter } from "next/navigation";
import { BoothLink } from "@/components/chat-booth/chat-header";
import { ChatForm, type ChatError, type ChatStep, type ChatValues } from "@/components/chat-booth/chat-form";
import { useSignup } from "@/components/auth/signup-context";
import { AuthError, authApi } from "@/lib/auth";
import { STUDENT_EMAIL_DOMAIN } from "@/lib/config";
import { validateEmail, validateUsername } from "@/lib/validation";

const steps: ChatStep[] = [
  {
    key: "username",
    question: "first up, pick a username",
    hint: "3–20 letters, numbers, dots or underscores.",
    kind: "text",
    placeholder: "husky_explorer",
    autoComplete: "username",
    maxLength: 20,
    validate: validateUsername,
  },
  {
    key: "email",
    question: "what's your student email?",
    hint: `it has to end in ${STUDENT_EMAIL_DOMAIN}. we'll email you a code to check it's you (no password needed).`,
    kind: "email",
    placeholder: `you${STUDENT_EMAIL_DOMAIN}`,
    autoComplete: "email",
    inputMode: "email",
    validate: validateEmail,
  },
];

export function SignupForm() {
  const router = useRouter();
  const { data, update } = useSignup();

  // Checks the username and email are free, then emails the code right away.
  async function sendCode({ username, email }: ChatValues): Promise<ChatError | void> {
    try {
      await authApi.signup(username, email);
    } catch (err) {
      if (!(err instanceof AuthError)) return "something went wrong. please try again.";
      if (err.code === "USERNAME_TAKEN") return { message: `${err.message} try another?`, retry: "username" };
      if (err.code === "EMAIL_TAKEN") return `${err.message} (link below)`;
      return err.message;
    }
    router.push("/signup/verify");
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4">
      <ChatForm
        title="sidequest signup"
        subtitle="step 1 of 3 · your account"
        label="Sign up chat"
        intro={["hey! welcome to sidequest 👋", "let's get you set up. it takes about a minute."]}
        steps={steps}
        values={{ username: data.username, email: data.email }}
        onAnswer={(key, value) => update({ [key]: value })}
        onReset={() => update({ username: "", email: "" })}
        onComplete={sendCode}
        closing={["code sent! 📬"]}
        next={{ href: "/signup/verify" }}
        footer={
          <>
            have an account? <BoothLink href="/login">log in</BoothLink>
          </>
        }
      />
    </div>
  );
}
