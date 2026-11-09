"use client";

import { useState } from "react";
import { MissingProfile } from "@/components/app/missing-profile";
import { useMe } from "@/components/app/profile-gate";
import { ProfileForm } from "@/components/app/profile-form";
import { PhotoStrip } from "@/components/chat-booth/photo-strip";
import { secondaryButton } from "@/components/chat-booth/styles";

export function ProfileView() {
  const { profile } = useMe().me;
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!profile) return <MissingProfile />;

  if (editing) {
    return (
      <ProfileForm
        profile={profile}
        onDone={() => {
          setEditing(false);
          setSaved(true);
        }}
      />
    );
  }

  const details = [
    ["username", `@${profile.username}`],
    ["email", profile.email],
    ["year", profile.year],
    ["major", profile.major],
    ["campus", profile.campus],
    ["gender", profile.gender],
  ];

  return (
    <div className="flex flex-col gap-10 md:flex-row-reverse md:items-start md:justify-between">
      <div className="flex justify-center md:w-64">
        <PhotoStrip picks={profile.interests} />
      </div>

      <div className="flex flex-1 flex-col gap-6 md:max-w-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{profile.firstName}</h1>
          <button
            type="button"
            onClick={() => {
              setSaved(false);
              setEditing(true);
            }}
            className={secondaryButton}
          >
            edit profile
          </button>
        </div>

        {saved && (
          <p role="status" className="w-fit rounded-full bg-frame2 px-3 py-1 text-sm font-semibold">
            saved ✓
          </p>
        )}

        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 rounded-3xl bg-white p-6 text-sm">
          {details.map(([term, value]) => (
            <div key={term} className="contents">
              <dt className="font-bold">{term}</dt>
              <dd className="break-all text-soft">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
