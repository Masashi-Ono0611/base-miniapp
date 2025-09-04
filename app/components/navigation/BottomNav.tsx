"use client";

import type React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type IconProps = React.SVGProps<SVGSVGElement>;

const HomeIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M3 11.5L12 4l9 7.5" />
    <path d="M5 10.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9.5" />
  </svg>
);

const QuestIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M9 11l2 2 4-4" />
    <rect x="3" y="4" width="18" height="16" rx="2" ry="2" />
  </svg>
);

const ClaimIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M12 3v12" />
    <path d="M8 11l4 4 4-4" />
    <rect x="3" y="15" width="18" height="6" rx="2" />
  </svg>
);

const AdminIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
    <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.1a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.1a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1A2 2 0 1 1 7.5 4.1l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.1a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6H20a2 2 0 1 1 0 4h-.1a1 1 0 0 0-.9.6z" />
  </svg>
);

const NAV_ITEMS = [
  { href: "/home", label: "Home", Icon: HomeIcon },
  { href: "/quest", label: "Quest", Icon: QuestIcon },
  { href: "/claim", label: "Claim", Icon: ClaimIcon },
  { href: "/admin", label: "Admin", Icon: AdminIcon },
] as const;

export default function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fid = searchParams.get("fid");

  return (
    <nav className="fixed bottom-0 left-0 right-0" aria-label="Bottom navigation">
      <div
        className="mx-auto w-full max-w-md px-2 pb-[env(safe-area-inset-bottom)]"
        style={{}}
      >
        <div className="border border-[var(--app-card-border)] bg-[var(--app-card-bg)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--app-card-bg)]/80 rounded-xl my-2 shadow-sm">
          <ul className="grid grid-cols-4 h-14 items-stretch">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              const href = fid ? `${item.href}?fid=${encodeURIComponent(fid)}` : item.href;
              return (
                <li key={item.href} className="flex">
                  <Link
                    href={href}
                    className={`flex-1 flex flex-col items-center justify-center gap-0.5 rounded-md text-xs transition-colors select-none ${
                      active
                        ? "text-[var(--app-foreground)] font-medium"
                        : "text-[var(--ock-text-foreground-muted)]"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    <item.Icon />
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
