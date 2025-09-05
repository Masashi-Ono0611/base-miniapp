"use client";

import { useCallback, useEffect, useState } from "react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import useFid from "../../hooks/useFid";

type Task = {
  id: string;
  title: string;
  link: string;
  points: number;
  completed?: boolean;
};

type Props = {
  onAnyCompleted?: () => void;
};

export default function QuestList({ onAnyCompleted }: Props) {
  const fid = useFid();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!fid) return;
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/quests?fid=${encodeURIComponent(fid)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("failed");
        const data = await res.json();
        setTasks(Array.isArray(data.tasks) ? data.tasks : []);
      } catch {
        setTasks([]);
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [fid, refreshKey]);

  const handleComplete = useCallback(
    async (task: Task) => {
      if (!fid) return;
      let ok = false;
      try {
        const res = await fetch("/api/quests/complete", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ fid, taskId: task.id }),
        });
        if (res.ok) {
          const data = (await res.json().catch(() => null)) as { ok?: boolean } | null;
          ok = Boolean(data?.ok);
        }
      } catch {
        ok = false;
      }
      if (ok) {
        setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed: true } : t)));
        setRefreshKey((k) => k + 1);
        onAnyCompleted?.();
      }
    },
    [fid, onAnyCompleted]
  );

  return (
    <Card title="Quests">
      {!fid ? (
        <p className="text-[var(--app-foreground-muted)] text-sm" role="status">
          Missing fid. Append <span className="font-mono">?fid=123</span> to the URL to enable quests.
        </p>
      ) : loading ? (
        <p className="text-[var(--app-foreground-muted)]" role="status">Loading quests…</p>
      ) : tasks.length === 0 ? (
        <p className="text-[var(--app-foreground-muted)]">No quests available right now. Please check back later.</p>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between rounded-lg border border-[var(--app-card-border)] p-3 bg-[var(--app-card-bg)]"
            >
              <div className="flex flex-col">
                <span className="font-medium text-[var(--app-foreground)]">{task.title}</span>
                <span className="text-xs text-[var(--app-foreground-muted)]">+{task.points} pts</span>
              </div>
              <Button
                variant={task.completed ? "secondary" : "primary"}
                size="sm"
                disabled={task.completed || !fid}
                onClick={() => {
                  handleComplete(task);
                  try {
                    window.open(task.link, "_blank", "noopener,noreferrer");
                  } catch {
                    // ignore
                  }
                }}
              >
                {task.completed ? "Completed" : "View Task"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
