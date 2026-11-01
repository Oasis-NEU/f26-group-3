"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { Bubble } from "@/components/chat-booth/bubble";
import { BoothLink, ChatHeader } from "@/components/chat-booth/chat-header";
import { PhotoStrip } from "@/components/chat-booth/photo-strip";
import { focusRing } from "@/components/chat-booth/styles";
import { SidequestMark } from "@/components/sidequest-mark";
import { clearStrip, getStripJson, parseStrip, subscribeHandoff } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function DoneView() {
  const router = useRouter();
  // undefined on the server; the JSON string (or null) in the browser
  const json = useSyncExternalStore(subscribeHandoff, getStripJson, () => undefined);
  if (json === undefined) return null;
  const strip = parseStrip(json);

  function signUpSomeoneElse() {
    clearStrip();
    router.push("/signup");
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4">
      <ChatHeader title="sidequest signup" subtitle="you're in" />
      {strip ? (
        <div className="flex flex-1 flex-col md:flex-row-reverse md:items-start md:justify-between md:gap-16">
          <div className="flex justify-center pt-6 pb-2 md:w-64 md:pt-12">
            <PhotoStrip picks={strip.interests} />
          </div>
          <section aria-label="You're in" className="flex flex-1 flex-col gap-2 py-4 md:max-w-md">
            <SidequestMark className="mb-2 h-14 w-16 motion-safe:animate-in motion-safe:zoom-in-90" />
            <Bubble from="app">you&apos;re in, {strip.firstName}! 🎉</Bubble>
            <Bubble from="app">your strip is printed. we&apos;ll use it to find people for your first sidequest.</Bubble>
            <Bubble from="app">see you out there 🗺️</Bubble>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className={cn(
                  "flex-1 rounded-full bg-me px-4 py-3 text-center text-sm font-semibold text-ink hover:opacity-90",
                  focusRing,
                )}
              >
                Log in
              </Link>
              <button
                type="button"
                onClick={signUpSomeoneElse}
                className={cn(
                  "flex-1 rounded-full border-[1.5px] border-ink bg-white px-4 py-3 text-sm font-semibold text-ink hover:bg-ink/5",
                  focusRing,
                )}
              >
                Sign up someone else
              </button>
            </div>
          </section>
        </div>
      ) : (
        <div className="flex flex-1 flex-col justify-end gap-2 py-8">
          <Bubble from="app">hmm, there&apos;s no strip here yet.</Bubble>
          <Bubble from="app">
            <BoothLink href="/signup">sign up</BoothLink> to print yours.
          </Bubble>
        </div>
      )}
    </div>
  );
}
