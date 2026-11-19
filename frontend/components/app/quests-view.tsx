"use client";

import Link from "next/link";
import { MissingProfile } from "@/components/app/missing-profile";
import { useMe } from "@/components/app/profile-gate";
import { PhotoStrip } from "@/components/chat-booth/photo-strip";
import { secondaryButton } from "@/components/chat-booth/styles";

// The page students land on after logging in. Matches will be listed here
// once the matching routes exist; until then it shows the empty state.
export function QuestsView() {
  const { profile } = useMe().me;
  if (!profile) return <MissingProfile />;

  return (
    <div className="flex flex-col gap-10 md:flex-row-reverse md:items-start md:justify-between">
      <div className="flex justify-center md:w-64">
        <PhotoStrip picks={profile.interests} />
      </div>

      <div className="flex flex-1 flex-col gap-8 md:max-w-xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">hey {profile.firstName} 👋</h1>
          <p className="mt-2 text-sm text-soft">here&apos;s who&apos;s down for the same sidequests as you.</p>
        </div>

        <section aria-labelledby="matches-heading" className="flex flex-col gap-4">
          <h2 id="matches-heading" className="text-lg font-bold">
            your matches
          </h2>
          <div className="flex flex-col items-start gap-3 rounded-3xl border-[1.5px] border-dashed border-ink/25 bg-white/60 p-6">
            <p className="font-semibold">no matches yet</p>
            <p className="text-sm text-soft">
              we&apos;re looking for people into {listInterests(profile.interests)}. new matches will show up here.
            </p>
            <Link href="/profile" className={secondaryButton}>
              change my sidequests
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

// ["a", "b", "c"] -> "a, b and c"
function listInterests(interests: string[]) {
  if (interests.length <= 1) return interests.join("");
  return `${interests.slice(0, -1).join(", ")} and ${interests.at(-1)}`;
}
