"use client";

import { useEffect, useState } from "react";
import Card from "../ui/Card";
import useFid from "../hooks/useFid";

export default function PointsSummary() {
  const fid = useFid();
  const [points, setPoints] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!fid) return;
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/points?fid=${encodeURIComponent(fid)}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!res.ok) throw new Error("failed");
        const data = await res.json();
        const next =
          typeof data.points === "number" ? data.points : Number(data.points ?? 0) || 0;
        setPoints(next);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [fid]);

  // Instant update via custom event from ClaimTxCard
  useEffect(() => {
    function onPointsUpdated(e: Event) {
      try {
        const detail = (e as CustomEvent).detail as { fid?: string; points?: number };
        if (!detail) return;
        if (fid && detail.fid === fid) {
          setPoints(typeof detail.points === "number" ? detail.points : 0);
        }
      } catch {
        // ignore
      }
    }
    window.addEventListener("bonsai:points-updated", onPointsUpdated as EventListener);
    return () => window.removeEventListener("bonsai:points-updated", onPointsUpdated as EventListener);
  }, [fid]);

  return (
    <Card title="Bonsai Points">
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-[var(--app-foreground)]">
          {points ?? 0}
        </span>
        <span className="text-[var(--app-foreground-muted)]">pts</span>
        {loading ? (
          <span className="text-xs text-[var(--app-foreground-muted)]">loading...</span>
        ) : null}
      </div>
      {!fid ? (
        <p className="text-xs text-yellow-400 mt-2">fid is missing. Please add ?fid=123 to the URL.</p>
      ) : null}
    </Card>
  );
}
