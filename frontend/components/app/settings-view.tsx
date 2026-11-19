"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMe } from "@/components/app/profile-gate";
import { secondaryButton } from "@/components/chat-booth/styles";
import { authApi } from "@/lib/auth";

export function SettingsView() {
  const router = useRouter();
  const { me } = useMe();
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function logOut() {
    setLoggingOut(true);
    setError(null);
    try {
      await authApi.logout();
      router.replace("/");
    } catch {
      setError("couldn't log you out. try again in a moment.");
      setLoggingOut(false);
    }
  }

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">settings</h1>

      <section aria-labelledby="account-heading" className="flex flex-col items-start gap-3 rounded-3xl bg-white p-6">
        <h2 id="account-heading" className="text-lg font-bold">
          account
        </h2>
        <p className="text-sm text-soft">
          logged in as <span className="font-semibold text-ink">{me.user.email}</span>
        </p>
        <button type="button" onClick={logOut} disabled={loggingOut} className={secondaryButton}>
          {loggingOut ? "logging out…" : "log out"}
        </button>
        {error && (
          <p role="alert" className="text-sm font-medium text-red-700">
            {error}
          </p>
        )}
      </section>
    </div>
  );
}
