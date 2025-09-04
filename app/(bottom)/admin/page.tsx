"use client";

import { useMemo, useState } from "react";
import { Card, Button } from "../../components";


export default function Page() {
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<{ title: string; link: string; points: string }>(
    { title: "", link: "", points: "" },
  );

  const valid = useMemo(() => {
    if (!form.title.trim() || !form.link.trim()) return false;
    if (form.points.trim() === "") return false; // must be explicitly provided
    const p = Number(form.points);
    return Number.isFinite(p) && p >= 0;
  }, [form]);

  // No task listing for now

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    try {
      const res = await fetch("/api/quests/admin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          link: form.link.trim(),
          points: Number(form.points),
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      await res.json().catch(() => ({} as any));
      // Reset only title/link/points for convenience (keep id for upsert)
      setForm({ title: "", link: "", points: "" });
    } catch (e) {
      setError("Failed to save task");
    }
  };


  return (
    <div className="space-y-6 animate-fade-in">
      <Card title="Admin: Quests">
        <div className="space-y-4">
          {error ? (
            <p className="text-red-400 text-sm">{error}</p>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 gap-3">
              <label className="text-sm text-[var(--app-foreground-muted)]">
                Title
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Follow X account"
                  className="mt-1 w-full rounded-md border border-[var(--app-card-border)] bg-[var(--app-card-bg)] px-3 py-2"
                />
              </label>
              <label className="text-sm text-[var(--app-foreground-muted)]">
                Link
                <input
                  value={form.link}
                  onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
                  placeholder="https://x.com/"
                  className="mt-1 w-full rounded-md border border-[var(--app-card-border)] bg-[var(--app-card-bg)] px-3 py-2"
                />
              </label>
              <label className="text-sm text-[var(--app-foreground-muted)]">
                Points
                <input
                  value={form.points}
                  onChange={(e) => setForm((f) => ({ ...f, points: e.target.value }))}
                  placeholder="100"
                  inputMode="numeric"
                  className="mt-1 w-full rounded-md border border-[var(--app-card-border)] bg-[var(--app-card-bg)] px-3 py-2"
                />
              </label>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={!valid}>
                Add
              </Button>
              <Button
                variant="secondary"
                type="button"
                onClick={() => setForm({ title: "", link: "", points: "" })}
              >
                Clear
              </Button>
            </div>
          </form>

          {/* Current Tasks list is intentionally omitted */}
        </div>
      </Card>
    </div>
  );
}
