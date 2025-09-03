"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, Button } from "../../components";
import PointsSummary from "../../components/points/PointsSummary";
import useFid from "../../components/hooks/useFid";

type Task = {
  id: string;
  title: string;
  link: string;
  points: number;
  completed?: boolean;
};

export default function Page() {
  const fid = useFid();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // force PointsSummary re-fetch

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
  }, [fid]);

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
          const data = await res.json().catch(() => null);
          ok = Boolean((data as any)?.ok);
        }
      } catch {
        ok = false;
      }
      if (ok) {
        setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed: true } : t)));
        setRefreshKey((k) => k + 1);
      }
      try {
        window.open(task.link, "_blank", "noopener,noreferrer");
      } catch {
        // ignore
      }
    },
    [fid],
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PointsSummary key={refreshKey} />
      <Card title="Quest">
        {!fid ? (
          <p className="text-[var(--app-foreground-muted)] text-sm">fid is missing. Please add ?fid=123 to the URL.</p>
        ) : loading ? (
          <p className="text-[var(--app-foreground-muted)]">Loading...</p>
        ) : tasks.length === 0 ? (
          <p className="text-[var(--app-foreground-muted)]">No tasks available.</p>
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
                  {task.completed ? "Completed" : "Open"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
