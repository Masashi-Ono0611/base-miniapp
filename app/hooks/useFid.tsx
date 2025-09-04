"use client";

import { useEffect, useState } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";

/**
 * Returns current user's fid.
 * Priority: MiniKit context -> setFrameReady() -> URL (?fid=123)
 */
export default function useFid() {
  const { context, setFrameReady } = useMiniKit();
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
      } catch {
        // ignore
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

  // Fallback: obtain fid from URL (?fid=123)
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

  return fid;
}
