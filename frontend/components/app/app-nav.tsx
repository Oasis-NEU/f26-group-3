"use client";

import { usePathname } from "next/navigation";
import { HeaderLink } from "@/components/site-header";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/quests", label: "quests" },
  { href: "/profile", label: "profile" },
  { href: "/settings", label: "settings" },
];

export function AppNav() {
  const pathname = usePathname();
  return LINKS.map(({ href, label }) => {
    const current = pathname === href;
    return (
      <HeaderLink key={href} href={href} aria-current={current ? "page" : undefined} className={cn(current && "bg-ink/10")}>
        {label}
      </HeaderLink>
    );
  });
}
