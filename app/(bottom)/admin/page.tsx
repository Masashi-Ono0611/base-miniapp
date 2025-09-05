"use client";

import { AdminQuestForm } from "../../components";
import Button from "../../components/ui/Button";
import { useState } from "react";

export default function Page() {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    try {
      setLoading(true);
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
