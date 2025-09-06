"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import Card from "../ui/Card";
import useFid from "../../hooks/useFid";

export default function Home() {
  const [points, setPoints] = useState<number>(0);
  const fid = useFid();

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
          typeof data.points === "number" ? data.points : Number(data.points ?? 0) || 0;
        setPoints(next);
      } catch (e) {
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
            typeof data.points === "number" ? data.points : Number(data.points ?? 0) || 0;
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
      <Card title="Tap to Earn">
        <div className="space-y-4">
          <p className="text-[var(--app-foreground-muted)]">
            Tap the bonsai to earn Bonsai Points. 
          </p>

          <div className="flex flex-col items-center">
            <div className="text-4xl font-bold text-[var(--app-foreground)] mb-2" aria-live="polite">{points} pts</div>
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
          </div>
        </div>
      </Card>
    </div>
  );
}
