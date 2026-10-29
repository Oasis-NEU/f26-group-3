export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 flex-col bg-page font-sans text-ink">{children}</div>;
}
