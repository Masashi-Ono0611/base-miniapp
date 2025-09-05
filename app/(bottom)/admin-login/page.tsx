"use client";

import { useState } from "react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        if (res.status === 401) {
          setError("Incorrect password.");
        } else {
          const data = await res.json().catch(() => ({ error: "Something went wrong." }));
          setError(data?.error || "Something went wrong.");
        }
        return;
      }
      const search = window.location.search || "";
      window.location.href = `/admin${search}`;
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title="Admin Login">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-[var(--app-foreground)]">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded border px-3 py-2 bg-[var(--app-card-bg)]"
            placeholder="Enter admin password"
            autoFocus
          />
        </div>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <div className="flex justify-end">
          <Button type="submit" variant="primary" disabled={loading || !password}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </div>
        <p className="text-xs text-[var(--app-foreground-muted)]">
          Access to /admin is restricted. Please enter the operator password.
        </p>
      </form>
    </Card>
  );
}
