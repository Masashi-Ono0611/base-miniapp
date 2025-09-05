"use client";

import { AdminQuestForm } from "../../components";
import Button from "../../components/ui/Button";
import { useEffect, useState } from "react";

export default function Page() {
  const [loading, setLoading] = useState(false);

  // Client-side guard for Mini App token mode
  useEffect(() => {
    const mode = (process.env.NEXT_PUBLIC_ADMIN_AUTH_MODE || "cookie").toLowerCase();
    if (mode === "token") {
      try {
        const token = localStorage.getItem("bonsai_admin_token");
        if (!token) {
          const search = window.location.search || "";
          window.location.replace(`/admin-login${search}`);
        }
      } catch {
        // ignore
      }
    }
  }, []);

  async function handleLogout() {
    try {
      setLoading(true);
      try {
        localStorage.removeItem("bonsai_admin_token");
      } catch {
        // ignore
      }
      await fetch("/api/admin/logout", { method: "POST" });
      const search = window.location.search || "";
      window.location.href = `/admin-login${search}`;
    } catch {
      const search = window.location.search || "";
      window.location.href = `/admin-login${search}`;
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="space-y-6 animate-fade-in">
      <AdminQuestForm />
      <div className="flex justify-end pt-2">
        <Button variant="secondary" size="sm" onClick={handleLogout} disabled={loading}>
          {loading ? "Logging out…" : "Logout"}
        </Button>
      </div>
    </div>
  );
}
