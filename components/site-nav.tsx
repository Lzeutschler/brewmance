"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const NAV = [
  { href: "/build", label: "Build" },
  { href: "/upgrade", label: "Upgrade" },
  { href: "/decks", label: "My Decks" },
  { href: "/goldfish", label: "Goldfish" },
  { href: "/quiz", label: "Quiz" },
];

export function ActiveNav() {
  return <Nav pathname={usePathname()} />;
}

export function Nav({ pathname }: { pathname: string | null }) {
  return (
    <nav className="flex h-full items-stretch gap-0.5 sm:gap-2">
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={pathname?.startsWith(item.href) ? "page" : undefined}
          className={cn(
            "ui-label relative flex items-center px-1.5 text-[0.8125rem] whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground min-[400px]:px-2 sm:px-3",
            "after:absolute after:inset-x-1.5 after:bottom-0 after:h-[3px] after:bg-transparent min-[400px]:after:inset-x-2 sm:after:inset-x-3",
            pathname?.startsWith(item.href) && "text-foreground after:bg-brand",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
