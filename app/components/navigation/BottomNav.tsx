"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/home", label: "Home" },
  { href: "/quest", label: "Quest" },
  { href: "/claim", label: "Claim" },
  { href: "/setting", label: "Setting" },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0">
      <div
        className="mx-auto w-full max-w-md px-2 pb-[env(safe-area-inset-bottom)]"
        style={{}}
      >
        <div className="border border-[var(--app-card-border)] bg-[var(--app-card-bg)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--app-card-bg)]/80 rounded-xl my-2 shadow-sm">
          <ul className="grid grid-cols-4 h-14 items-stretch">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href} className="flex">
                  <Link
                    href={item.href}
                    className={`flex-1 flex flex-col items-center justify-center gap-0.5 rounded-md text-xs transition-colors select-none ${
                      active
                        ? "text-[var(--app-foreground)] font-medium"
                        : "text-[var(--ock-text-foreground-muted)]"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
}
