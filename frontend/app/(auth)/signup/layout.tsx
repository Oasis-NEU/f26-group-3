import { SignupProvider } from "@/components/auth/signup-context";

// Keeps answers alive while moving between /signup, /signup/details and /signup/interests.
export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <SignupProvider>{children}</SignupProvider>;
}
