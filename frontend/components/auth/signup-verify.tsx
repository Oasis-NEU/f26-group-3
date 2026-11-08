"use client";

import { Bubble } from "@/components/chat-booth/bubble";
import { BoothLink, ChatHeader } from "@/components/chat-booth/chat-header";
import { useSignup } from "@/components/auth/signup-context";
import { VerifyChat } from "@/components/auth/verify-form";
import { validateEmail } from "@/lib/validation";

// /signup/verify: the code step right after the student gives their email.
// Lives under /signup so the answers in SignupProvider survive it.
export function SignupVerify() {
  const { data } = useSignup();

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4">
      {!data.email || validateEmail(data.email) ? (
        <>
          <ChatHeader title="sidequest signup" subtitle="check your email" />
          <div role="log" className="flex flex-1 flex-col justify-end gap-2 py-8">
            <Bubble from="app">hmm, i don&apos;t have your email yet.</Bubble>
            <Bubble from="app">
              <BoothLink href="/signup">start at step 1</BoothLink> and i&apos;ll send you a code.
            </Bubble>
          </div>
        </>
      ) : (
        <VerifyChat
          email={data.email}
          title="sidequest signup"
          subtitle="step 1 of 3 · check your email"
          next={() => ({ href: "/signup/details" })}
        />
      )}
    </div>
  );
}
