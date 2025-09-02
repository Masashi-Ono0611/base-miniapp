"use client";

import Image from "next/image";
import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import {
  Transaction,
  TransactionButton,
  TransactionToast,
  TransactionToastAction,
  TransactionToastIcon,
  TransactionToastLabel,
  TransactionError,
  TransactionResponse,
  TransactionStatusAction,
  TransactionStatusLabel,
  TransactionStatus,
} from "@coinbase/onchainkit/transaction";
import { useNotification, useClose, useMiniKit } from "@coinbase/onchainkit/minikit";

type ButtonProps = {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  icon?: ReactNode;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  onClick,
  disabled = false,
  type = "button",
  icon,
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0052FF] disabled:opacity-50 disabled:pointer-events-none";

  const variantClasses = {
    primary:
      "bg-[var(--app-accent)] hover:bg-[var(--app-accent-hover)] text-[var(--app-background)]",
    secondary:
      "bg-[var(--app-gray)] hover:bg-[var(--app-gray-dark)] text-[var(--app-foreground)]",
    outline:
      "border border-[var(--app-accent)] hover:bg-[var(--app-accent-light)] text-[var(--app-accent)]",
    ghost:
      "hover:bg-[var(--app-accent-light)] text-[var(--app-foreground-muted)]",
  };

  const sizeClasses = {
    sm: "text-xs px-2.5 py-1.5 rounded-md",
    md: "text-sm px-4 py-2 rounded-lg",
    lg: "text-base px-6 py-3 rounded-lg",
  };

  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="flex items-center mr-2">{icon}</span>}
      {children}
    </button>
  );
}

type CardProps = {
  title?: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

function Card({
  title,
  children,
  className = "",
  onClick,
}: CardProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={`bg-[var(--app-card-bg)] backdrop-blur-md rounded-xl shadow-lg border border-[var(--app-card-border)] overflow-hidden transition-all hover:shadow-xl ${className} ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? "button" : undefined}
    >
      {title && (
        <div className="px-5 py-3 border-b border-[var(--app-card-border)]">
          <h3 className="text-lg font-medium text-[var(--app-foreground)]">
            {title}
          </h3>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

// Features removed for BONSAI Tap-to-Earn minimal UI

export function Home() {
  const close = useClose();
  const [points, setPoints] = useState<number>(0);
 
  const { context, setFrameReady } = useMiniKit();

  // Prefer Farcaster Mini App context fid; fallback to URL query on web
  const [fid, setFid] = useState<string | null>(null);

  // Initialize MiniKit frame and capture context fid
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ctx = await setFrameReady();
        if (cancelled) return;
        const f = ctx?.context?.user?.fid;
        if (f) setFid(String(f));
      } catch (e) {
        console.warn("setFrameReady failed", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setFrameReady]);

  // Watch for context updates and sync fid
  useEffect(() => {
    const f = context?.user?.fid;
    if (f) setFid(String(f));
  }, [context]);

  // Fallback: obtain fid from URL (?fid=123) after mount to avoid SSR/CSR mismatch
  useEffect(() => {
    if (fid) return;
    try {
      const sp = new URLSearchParams(window.location.search);
      const qfid = sp.get("fid");
      if (qfid) setFid(qfid);
    } catch {
      // ignore
    }
  }, [fid]);

  // Load initial points when fid exists
  useEffect(() => {
    if (!fid) return;
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(`/api/points?fid=${encodeURIComponent(fid)}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = await res.json();
        const next =
          typeof data.points === "number"
            ? data.points
            : Number(data.points ?? 0) || 0;
        setPoints(next);
      } catch (e) {
        // noop for aborts / network errors in MVP
        console.warn("failed to load points", e);
      }
    })();
    return () => controller.abort();
  }, [fid]);

  const handleTap = useCallback(async () => {
    if (fid) {
      try {
        const res = await fetch("/api/points/increment", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ fid }),
        });
        if (res.ok) {
          const data = await res.json();
          const next =
            typeof data.points === "number"
              ? data.points
              : Number(data.points ?? 0) || 0;
          setPoints(next);
          return;
        }
      } catch (e) {
        console.warn("increment failed, fallback to local", e);
      }
    }
    // Fallback for when fid is absent or API fails
    setPoints((p) => p + 1);
  }, [fid]);

  return (
    <div className="space-y-6 animate-fade-in">
      <Card title="BONSAI Tap to Earn">
        <div className="space-y-4">
          <p className="text-[var(--app-foreground-muted)]">
            Tap the bonsai to earn Bonsai Points.
          </p>

          <div className="flex flex-col items-center">
            <div className="text-4xl font-bold text-[var(--app-foreground)] mb-2">
              {points} pts
            </div>
            <button
              type="button"
              aria-label="Tap bonsai to earn"
              onPointerDown={(e) => {
                e.preventDefault();
                handleTap();
              }}
              className="rounded-xl border border-[var(--app-card-border)] p-2 hover:scale-[1.02] active:scale-95 transition-transform bg-[var(--app-card-bg)] select-none"
            >
              <Image
                src="https://static.wixstatic.com/media/3e4de0_01df3c0ec3f240b9811cd3632070381f~mv2.jpg/v1/fill/w_200,h_200,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/bok3.jpg"
                alt="BONSAI"
                width={200}
                height={200}
                priority
                className="rounded-lg"
                draggable={false}
              />
            </button>

            <div className="mt-3">
              <Button variant="secondary" size="sm" onClick={() => close()}>
                Close Mini App
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <TransactionCard />
    </div>
  );
}

type IconProps = {
  name: "heart" | "star" | "check" | "plus" | "arrow-right";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Icon({ name, size = "md", className = "" }: IconProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const icons = {
    heart: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <title>Heart</title>
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
    star: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <title>Star</title>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    check: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <title>Check</title>
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    plus: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <title>Plus</title>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
    "arrow-right": (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <title>Arrow Right</title>
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </svg>
    ),
  };

  return (
    <span className={`inline-block ${sizeClasses[size]} ${className}`}>
      {icons[name]}
    </span>
  );
}

// TodoList removed for minimal UI


function TransactionCard() {
  const { address } = useAccount();

  // Example transaction call - sending 0 ETH to self
  const calls = useMemo(() => address
    ? [
        {
          to: address,
          data: "0x" as `0x${string}`,
          value: BigInt(0),
        },
      ]
    : [], [address]);

  const sendNotification = useNotification();

  const handleSuccess = useCallback(async (response: TransactionResponse) => {
    const transactionHash = response.transactionReceipts[0].transactionHash;

    console.log(`Transaction successful: ${transactionHash}`);

    await sendNotification({
      title: "Congratulations!",
      body: `You sent your a transaction, ${transactionHash}!`,
    });
  }, [sendNotification]);

  return (
    <Card title="Make Your First Transaction">
      <div className="space-y-4">
        <p className="text-[var(--app-foreground-muted)] mb-4">
          Experience the power of seamless sponsored transactions with{" "}
          <a
            href="https://onchainkit.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#0052FF] hover:underline"
          >
            OnchainKit
          </a>
          .
        </p>

        <div className="flex flex-col items-center">
          {address ? (
            <Transaction
              calls={calls}
              onSuccess={handleSuccess}
              onError={(error: TransactionError) =>
                console.error("Transaction failed:", error)
              }
            >
              <TransactionButton className="text-white text-md" />
              <TransactionStatus>
                <TransactionStatusAction />
                <TransactionStatusLabel />
              </TransactionStatus>
              <TransactionToast className="mb-4">
                <TransactionToastIcon />
                <TransactionToastLabel />
                <TransactionToastAction />
              </TransactionToast>
            </Transaction>
          ) : (
            <p className="text-yellow-400 text-sm text-center mt-2">
              Connect your wallet to send a transaction
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
