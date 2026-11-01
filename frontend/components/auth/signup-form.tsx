"use client";

import { BoothLink } from "@/components/chat-booth/chat-header";
import { ChatForm, type ChatStep } from "@/components/chat-booth/chat-form";
import { useSignup } from "@/components/auth/signup-context";
import { STUDENT_EMAIL_DOMAIN } from "@/lib/config";
import { PASSWORD_MIN_LENGTH, validateEmail, validatePassword, validateUsername } from "@/lib/validation";

export function SignupForm() {
  const { data, update } = useSignup();

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
      hint: `it has to end in ${STUDENT_EMAIL_DOMAIN}. we'll send a code to check it's you.`,
      kind: "email",
      placeholder: `you${STUDENT_EMAIL_DOMAIN}`,
      autoComplete: "email",
      inputMode: "email",
      validate: validateEmail,
    },
    {
      key: "password",
      question: "now make a password",
      hint: `${PASSWORD_MIN_LENGTH}+ characters, and don't use your email name.`,
      kind: "password",
      autoComplete: "new-password",
      validate: (v) => validatePassword(v, data.email),
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4">
      <ChatForm
        title="sidequest signup"
        subtitle="step 1 of 3 · your account"
        label="Sign up chat"
        intro={["hey! welcome to sidequest 👋", "let's get you set up. it takes about a minute."]}
        steps={steps}
        values={{ username: data.username, email: data.email, password: data.password }}
        onAnswer={(key, value) => update({ [key]: value })}
        onReset={() => update({ username: "", email: "", password: "" })}
        closing={["nice, your account is set.", "next up: a little about you."]}
        next={{ href: "/signup/details" }}
        footer={
          <>
            have an account? <BoothLink href="/login">log in</BoothLink>
          </>
        }
      />
    </div>
  );
}
