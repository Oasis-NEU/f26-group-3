"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { primaryButton } from "@/components/chat-booth/styles";
import { ApiError } from "@/lib/api";
import { type Me, profileApi } from "@/lib/profile";

type ProfileContextValue = { me: Me; setMe: (me: Me) => void };

const ProfileContext = createContext<ProfileContextValue | null>(null);

// The logged-in student, for any page inside ProfileGate.
export function useMe() {
  const value = useContext(ProfileContext);
  if (!value) throw new Error("useMe must be used inside <ProfileGate>");
  return value;
}

type GateState = { status: "loading" } | { status: "ready"; me: Me } | { status: "error"; message: string };

// Loads the student once for every logged-in page. Logged-out visitors are
// sent to /login, which brings them back here afterwards. The backend still
// checks the session on every request; this only decides what to render.
export function ProfileGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<GateState>({ status: "loading" });

  const fetchMe = useCallback(() => {
    profileApi.me().then(
      (me) => setState({ status: "ready", me }),
      (err) => {
        if (err instanceof ApiError && err.status === 401) {
          router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        } else {
          setState({ status: "error", message: err instanceof ApiError ? err.message : "something went wrong." });
        }
      },
    );
  }, [router, pathname]);

  // Runs on first load and again (in the background) when the page changes,
  // so a session that expired mid-visit is noticed on the next navigation.
  useEffect(fetchMe, [fetchMe]);

  function retry() {
    setState({ status: "loading" });
    fetchMe();
  }

  const setMe = useCallback((me: Me) => setState({ status: "ready", me }), []);

  if (state.status === "loading") {
    return (
      <p role="status" className="mx-auto py-24 text-sm text-soft">
        loading your strip…
      </p>
    );
  }

  if (state.status === "error") {
    return (
      <div role="alert" className="mx-auto flex flex-col items-center gap-4 py-24 text-center text-sm">
        <p>{state.message}</p>
        <button type="button" onClick={retry} className={primaryButton}>
          try again
        </button>
      </div>
    );
  }

  return <ProfileContext.Provider value={{ me: state.me, setMe }}>{children}</ProfileContext.Provider>;
}
