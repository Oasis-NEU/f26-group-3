"use client";

import { Fragment, createContext, useContext, useLayoutEffect, useState } from "react";
import type { SignupPayload } from "@/lib/auth";

// Answers collected across /signup, /signup/details and /signup/interests.
// Held in memory only (never storage) because it includes the password.

type SignupState = SignupPayload;

const EMPTY: SignupState = {
  username: "",
  email: "",
  password: "",
  firstName: "",
  gender: "",
  year: "",
  major: "",
  campus: "",
  interests: [],
};

type SignupContextValue = {
  data: SignupState;
  update: (patch: Partial<SignupState>) => void;
};

const SignupContext = createContext<SignupContextValue | null>(null);

export function SignupProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<SignupState>(EMPTY);
  // Bumped on reset so every page's chat starts over too.
  const [session, setSession] = useState(0);

  // Next keeps left pages mounted but hidden. When the user leaves /signup/*
  // (e.g. after "Print my strip"), wipe the answers so the password doesn't
  // linger in memory and the next visit starts fresh.
  useLayoutEffect(() => {
    return () => {
      setData(EMPTY);
      setSession((s) => s + 1);
    };
  }, []);

  const value: SignupContextValue = {
    data,
    update: (patch) => setData((d) => ({ ...d, ...patch })),
  };
  return (
    <SignupContext.Provider value={value}>
      <Fragment key={session}>{children}</Fragment>
    </SignupContext.Provider>
  );
}

export function useSignup() {
  const ctx = useContext(SignupContext);
  if (!ctx) throw new Error("useSignup must be used inside <SignupProvider>");
  return ctx;
}
