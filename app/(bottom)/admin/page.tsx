"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, Button } from "../../components";

type Task = {
  id: string;
  title: string;
  link: string;
  points: number;
};

export default function Page() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<{ id: string; title: string; link: string; points: string }>(
    { id: "", title: "", link: "", points: "" },
  );

  const valid = useMemo(() => {
    if (!form.id.trim() || !form.title.trim() || !form.link.trim()) return false;
    const p = Number(form.points);
    return Number.isFinite(p) && p >= 0;
  }, [form]);

  async function fetchTasks() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/quests/admin", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setTasks(Array.isArray(data.tasks) ? data.tasks : []);
    } catch (e) {
      setError("Failed to load tasks");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    try {
      const res = await fetch("/api/quests/admin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: form.id.trim(),
          title: form.title.trim(),
          link: form.link.trim(),
          points: Number(form.points),
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const data = await res.json();
      setTasks(Array.isArray(data.tasks) ? data.tasks : tasks);
      // Reset only title/link/points for convenience (keep id for upsert)
      setForm((prev) => ({ ...prev, title: "", link: "", points: "" }));
    } catch (e) {
      setError("Failed to save task");
    }
  };

  const handleDelete = async (id: string) => {
    if (!id) return;
    try {
      const res = await fetch(`/api/quests/admin?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      const data = await res.json();
      setTasks(Array.isArray(data.tasks) ? data.tasks : tasks.filter((t) => t.id !== id));
    } catch (e) {
      setError("Failed to delete task");
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
                ID
                <input
                  value={form.id}
                  onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
                  placeholder="follow_x"
                  className="mt-1 w-full rounded-md border border-[var(--app-card-border)] bg-[var(--app-card-bg)] px-3 py-2"
                />
              </label>
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
                {tasks.some((t) => t.id === form.id.trim()) ? "Update" : "Add"}
              </Button>
              <Button
                variant="secondary"
                type="button"
                onClick={() => setForm({ id: "", title: "", link: "", points: "" })}
              >
                Clear
              </Button>
            </div>
          </form>

          <div className="pt-2">
            <h3 className="text-sm font-medium text-[var(--app-foreground)] mb-2">Current Tasks</h3>
            {loading ? (
              <p className="text-sm text-[var(--app-foreground-muted)]">Loading...</p>
            ) : tasks.length === 0 ? (
              <p className="text-sm text-[var(--app-foreground-muted)]">No tasks</p>
            ) : (
              <ul className="space-y-2">
                {tasks.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between rounded-lg border border-[var(--app-card-border)] p-3 bg-[var(--app-card-bg)]"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-[var(--app-foreground)] truncate">{t.title}</div>
                      <div className="text-xs text-[var(--app-foreground-muted)] truncate">{t.link}</div>
                      <div className="text-xs text-[var(--app-foreground-muted)]">id: {t.id} / +{t.points} pts</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setForm({ id: t.id, title: t.title, link: t.link, points: String(t.points) })}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(t.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
